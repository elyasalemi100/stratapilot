"use server";

import { createClient } from "@/lib/supabase/server";

export type UserRole =
  | "platform_super_admin"
  | "management_admin"
  | "strata_manager"
  | "committee_member"
  | "lot_owner"
  | "read_only_auditor";

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", user.id)
    .single();

  return (profile?.role as UserRole) ?? null;
}

export async function canAccessOc(ocId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("users_profile")
    .select("management_company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) return false;
  if (profile.role === "platform_super_admin") return true;

  const { data: oc } = await supabase
    .from("oc")
    .select("management_company_id")
    .eq("id", ocId)
    .single();

  if (!oc) return false;
  if (profile.management_company_id === oc.management_company_id &&
      ["management_admin", "strata_manager"].includes(profile.role)) {
    return true;
  }

  const { data: assignment } = await supabase
    .from("user_oc_assignments")
    .select("id")
    .eq("user_id", user.id)
    .eq("oc_id", ocId)
    .single();

  return !!assignment;
}

export async function isSuperAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === "platform_super_admin";
}
