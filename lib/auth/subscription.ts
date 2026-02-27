"use server";

import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "./permissions";

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "unpaid" | null;

/**
 * Returns true if the user has access to the dashboard (valid subscription or bypass).
 * Used to gate dashboard access and prevent free usage.
 */
export async function hasSubscriptionAccess(): Promise<boolean> {
  const superAdmin = await isSuperAdmin();
  if (superAdmin) return true;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("users_profile")
    .select("management_company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.management_company_id) return false;

  const { data: company } = await supabase
    .from("management_companies")
    .select("is_enterprise, stripe_subscription_id, subscription_status")
    .eq("id", profile.management_company_id)
    .single();

  if (!company) return false;

  // Enterprise bypasses subscription
  if (company.is_enterprise) return true;

  // Must have a subscription
  if (!company.stripe_subscription_id) return false;

  // Allow active and past_due (grace period); block canceled and unpaid
  const status = company.subscription_status as SubscriptionStatus;
  if (status === "canceled" || status === "unpaid") return false;

  return true;
}

/**
 * Get the first OC slug for redirecting to billing, or null.
 */
export async function getFirstOcSlugForBilling(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users_profile")
    .select("management_company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.management_company_id) return null;

  const { data: ocList } = await supabase
    .from("oc")
    .select("slug")
    .eq("management_company_id", profile.management_company_id)
    .is("deleted_at", null)
    .order("created_at")
    .limit(1);

  return ocList?.[0]?.slug ?? null;
}
