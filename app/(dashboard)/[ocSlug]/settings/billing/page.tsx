import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { BillingClient } from "./billing-client";
import { PRICING_PLANS, formatPrice } from "@/lib/stripe/config";
import { isStripeConfigured } from "@/lib/stripe/client";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  const { data: company } = await supabase
    .from("management_companies")
    .select("id, name, stripe_customer_id, stripe_subscription_id, max_ocs, max_users")
    .eq("id", oc.management_company_id)
    .single();

  if (!company) notFound();

  const isAdmin =
    profile?.role === "management_admin" || profile?.role === "platform_super_admin";

  if (!isAdmin) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Only management admins can view and manage billing.
        </p>
      </div>
    );
  }

  const hasStripe = !!company.stripe_customer_id;
  const stripeConfigured = isStripeConfigured();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your {company.name} subscription
        </p>
      </div>

      {!stripeConfigured && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-700 dark:text-amber-600">
              Stripe is not configured. Set STRIPE_SECRET_KEY and
              NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable subscriptions.
            </p>
          </CardContent>
        </Card>
      )}

      {hasStripe && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
            <CardDescription>
              Manage your subscription, payment method, and invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BillingClient
              ocSlug={ocSlug}
              hasSubscription={!!company.stripe_subscription_id}
            />
          </CardContent>
        </Card>
      )}

      {stripeConfigured && !hasStripe && (
        <Card>
          <CardHeader>
            <CardTitle>Choose a plan</CardTitle>
            <CardDescription>
              Select a plan to get started with StrataPilot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {PRICING_PLANS.filter((p) => p.id !== "enterprise").map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-lg border p-4 space-y-4"
                >
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatPrice(plan.priceMonthly)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /mo
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      or {formatPrice(plan.priceYearly)}/year
                    </p>
                  </div>
                  <ul className="text-sm space-y-1">
                    {plan.features.slice(0, 3).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <BillingClient
                    ocSlug={ocSlug}
                    hasSubscription={false}
                    planId={plan.id}
                  />
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Enterprise plans:{" "}
              <a href="mailto:sales@stratapilot.com.au" className="text-primary hover:underline">
                Contact sales
              </a>
            </p>
          </CardContent>
        </Card>
      )}

      {hasStripe && (
        <Card>
          <CardHeader>
            <CardTitle>Stripe Dashboard</CardTitle>
            <CardDescription>
              View invoices and manage payment methods in Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Open Stripe Dashboard
              <ExternalLink className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
