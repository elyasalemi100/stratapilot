"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe/client";
import { getPlanById } from "@/lib/stripe/config";

export async function createCheckoutSession(
  planId: string,
  billingInterval: "monthly" | "yearly",
  successUrl: string,
  cancelUrl: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users_profile")
    .select("management_company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.management_company_id) {
    throw new Error("No management company assigned. Contact support.");
  }

  const isAdmin =
    profile.role === "management_admin" || profile.role === "platform_super_admin";
  if (!isAdmin) {
    throw new Error("Only management admins can manage billing.");
  }

  const plan = getPlanById(planId);
  if (!plan) throw new Error("Invalid plan");

  if (plan.id === "enterprise") {
    throw new Error("Contact sales for Enterprise pricing.");
  }

  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const priceId =
    billingInterval === "monthly"
      ? plan.stripePriceIdMonthly
      : plan.stripePriceIdYearly;

  if (!priceId) {
    throw new Error(
      `Stripe price not configured for ${plan.name} (${billingInterval}). Set STRIPE_PRICE_* env vars.`
    );
  }

  const { data: company } = await supabase
    .from("management_companies")
    .select("id, name, stripe_customer_id")
    .eq("id", profile.management_company_id)
    .single();

  if (!company) throw new Error("Management company not found");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      management_company_id: company.id,
      plan_id: planId,
      billing_interval: billingInterval,
    },
    subscription_data: {
      metadata: {
        management_company_id: company.id,
        plan_id: planId,
      },
    },
    ...(company.stripe_customer_id
      ? { customer: company.stripe_customer_id }
      : {
          customer_email: user.email ?? undefined,
          customer_creation: "always" as const,
        }),
  });
  if (!session.url) throw new Error("Failed to create checkout session");
  redirect(session.url);
}

export async function createBillingPortalSession(returnUrl: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users_profile")
    .select("management_company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.management_company_id) {
    throw new Error("No management company assigned.");
  }

  const isAdmin =
    profile.role === "management_admin" || profile.role === "platform_super_admin";
  if (!isAdmin) {
    throw new Error("Only management admins can manage billing.");
  }

  const { data: company } = await supabase
    .from("management_companies")
    .select("stripe_customer_id")
    .eq("id", profile.management_company_id)
    .single();

  if (!company?.stripe_customer_id) {
    throw new Error("No Stripe customer. Subscribe to a plan first.");
  }

  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const session = await stripe.billingPortal.sessions.create({
    customer: company.stripe_customer_id,
    return_url: returnUrl,
  });
  redirect(session.url);
}
