"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getOcsForUser() {
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
    return [];
  }

  const { data: ocs } = await supabase
    .from("oc")
    .select("id, name, plan_number, slug")
    .eq("management_company_id", profile.management_company_id)
    .is("deleted_at", null)
    .order("name");

  return ocs ?? [];
}

export async function getOcBySlug(slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: oc, error } = await supabase
    .from("oc")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (error || !oc) return null;
  return oc;
}

export async function getDashboardBadges(ocId: string) {
  const supabase = await createClient();

  const { data: bankAccounts } = await supabase
    .from("bank_accounts")
    .select("id")
    .eq("oc_id", ocId)
    .is("deleted_at", null);

  const bankAccountIds = bankAccounts?.map((b) => b.id) ?? [];

  const [arrearsResult, unreconciledResult, draftsResult] = await Promise.all([
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("oc_id", ocId)
      .in("status", ["overdue", "issued"])
      .lt("due_date", new Date().toISOString().split("T")[0])
      .is("deleted_at", null),
    bankAccountIds.length > 0
      ? supabase
          .from("bank_transactions")
          .select("id", { count: "exact", head: true })
          .in("bank_account_id", bankAccountIds)
          .is("reconciled_at", null)
          .is("deleted_at", null)
      : { count: 0 },
    supabase
      .from("levy_runs")
      .select("id", { count: "exact", head: true })
      .eq("oc_id", ocId)
      .eq("status", "draft")
      .is("deleted_at", null),
  ]);

  return {
    arrearsCount: arrearsResult.count ?? 0,
    unreconciledCount: unreconciledResult.count ?? 0,
    draftLevyRuns: draftsResult.count ?? 0,
  };
}
