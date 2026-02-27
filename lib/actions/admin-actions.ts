"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "platform_super_admin") {
    redirect("/");
  }
  return supabase;
}

export async function getPlatformSettings() {
  const supabase = await requireSuperAdmin();
  const { data } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["signups_blocked", "email_whitelist_enabled", "require_email_verification"]);
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

export async function updatePlatformSetting(key: string, value: unknown) {
  const supabase = await requireSuperAdmin();
  await supabase
    .from("platform_settings")
    .upsert({ key, value: value as object, updated_at: new Date().toISOString() }, { onConflict: "key" });
  revalidatePath("/admin");
}

export async function getBranches() {
  const supabase = await requireSuperAdmin();
  const { data } = await supabase
    .from("management_companies")
    .select(`
      id, name, abn, address, status, suspended_at, suspended_reason,
      is_enterprise, max_ocs, max_users,
      stripe_customer_id, stripe_subscription_id,
      created_at
    `)
    .is("deleted_at", null)
    .order("name");
  return data ?? [];
}

export async function getBranchOcCount(companyId: string) {
  const supabase = await requireSuperAdmin();
  const { count } = await supabase
    .from("oc")
    .select("id", { count: "exact", head: true })
    .eq("management_company_id", companyId)
    .is("deleted_at", null);
  return count ?? 0;
}

export async function getBranchUserCount(companyId: string) {
  const supabase = await requireSuperAdmin();
  const { count } = await supabase
    .from("users_profile")
    .select("id", { count: "exact", head: true })
    .eq("management_company_id", companyId)
    .is("deleted_at", null);
  return count ?? 0;
}

export async function updateBranchStatus(
  companyId: string,
  status: "active" | "suspended" | "banned",
  reason?: string
) {
  const supabase = await requireSuperAdmin();
  const now = new Date().toISOString();
  await supabase
    .from("management_companies")
    .update({
      status,
      suspended_at: status === "suspended" ? now : null,
      suspended_reason: status === "suspended" ? reason ?? null : null,
      banned_at: status === "banned" ? now : null,
      banned_reason: status === "banned" ? reason ?? null : null,
    })
    .eq("id", companyId);
  revalidatePath("/admin");
}

export async function getAllUsers() {
  const supabase = await requireSuperAdmin();
  const { data } = await supabase
    .from("users_profile")
    .select(`
      id, email, full_name, role, status, suspended_at, banned_at,
      management_company_id, is_enterprise, created_at,
      company:management_companies(name)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function updateUserStatus(
  userId: string,
  status: "active" | "suspended" | "banned",
  reason?: string
) {
  const supabase = await requireSuperAdmin();
  await supabase
    .from("users_profile")
    .update({
      status,
      suspended_at: status === "suspended" ? new Date().toISOString() : null,
      suspended_reason: status === "suspended" ? reason ?? null : null,
      banned_at: status === "banned" ? new Date().toISOString() : null,
      banned_reason: status === "banned" ? reason ?? null : null,
    })
    .eq("id", userId);
  revalidatePath("/admin");
}

export async function getEmailWhitelist() {
  const supabase = await requireSuperAdmin();
  const { data } = await supabase
    .from("email_whitelist")
    .select("id, pattern, pattern_type, created_at")
    .order("pattern");
  return data ?? [];
}

export async function addEmailWhitelist(pattern: string, patternType: "domain" | "exact") {
  const supabase = await requireSuperAdmin();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("email_whitelist").insert({
    pattern: pattern.trim().toLowerCase(),
    pattern_type: patternType,
    created_by: user?.id,
  });
  revalidatePath("/admin");
}

export async function removeEmailWhitelist(id: string) {
  const supabase = await requireSuperAdmin();
  await supabase.from("email_whitelist").delete().eq("id", id);
  revalidatePath("/admin");
}

export async function getCouponCodes() {
  const supabase = await requireSuperAdmin();
  const { data } = await supabase
    .from("coupon_codes")
    .select("id, code, coupon_type, value, max_redemptions, redemption_count, valid_from, valid_until, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createCouponCode(params: {
  code: string;
  coupon_type: "percent" | "fixed" | "trial_days";
  value: number;
  max_redemptions?: number;
  valid_until?: string;
}) {
  const supabase = await requireSuperAdmin();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("coupon_codes").insert({
    code: params.code.toUpperCase().trim(),
    coupon_type: params.coupon_type,
    value: params.value,
    max_redemptions: params.max_redemptions ?? null,
    valid_until: params.valid_until ?? null,
    created_by: user?.id,
  });
  revalidatePath("/admin");
}

export async function deleteCouponCode(id: string) {
  const supabase = await requireSuperAdmin();
  await supabase.from("coupon_codes").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin");
}

export async function getAllSubdivisions() {
  const supabase = await requireSuperAdmin();
  const { data } = await supabase
    .from("oc_subdivisions")
    .select(`
      id, plan_number, common_property_notes, created_at,
      oc:oc(id, name, plan_number, management_company_id)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500);
  return data ?? [];
}
