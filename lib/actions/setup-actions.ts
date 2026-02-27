"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createOcFromWizard(data: {
  name: string;
  plan_number: string;
  address?: string;
  abn?: string;
  gst_registered: boolean;
  management_start_date?: string;
  management_end_date?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users_profile")
    .select("management_company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.management_company_id) {
    throw new Error(
      "No management company assigned. Please contact your administrator to link your account to a management company."
    );
  }

  const slug = data.plan_number.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const { data: oc, error } = await supabase
    .from("oc")
    .insert({
      management_company_id: profile.management_company_id,
      name: data.name,
      plan_number: data.plan_number,
      address: data.address || null,
      abn: data.abn || null,
      gst_registered: data.gst_registered,
      management_start_date: data.management_start_date || null,
      management_end_date: data.management_end_date || null,
      slug,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("user_oc_assignments").insert({
    user_id: user.id,
    oc_id: oc.id,
  });

  revalidatePath("/portfolio");
  return { oc, slug };
}

export async function addSubdivision(ocId: string, data: {
  plan_number: string;
  common_property_notes?: string;
  lot_schedule?: Record<string, unknown>[];
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("oc_subdivisions").insert({
    oc_id: ocId,
    plan_number: data.plan_number,
    common_property_notes: data.common_property_notes || null,
    lot_schedule: data.lot_schedule ? (data.lot_schedule as unknown) : null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function addLots(ocId: string, lots: {
  lot_number: string;
  unit_address?: string;
  entitlements: number;
  liabilities: number;
  parking?: string;
  storage?: string;
  subdivision_id?: string;
}[]) {
  const supabase = await createClient();
  const subdivisionResult = await supabase
    .from("oc_subdivisions")
    .select("id")
    .eq("oc_id", ocId)
    .is("deleted_at", null)
    .limit(1)
    .single();

  const subdivisionId = subdivisionResult.data?.id ?? null;

  for (const lot of lots) {
    const { error } = await supabase.from("lots").insert({
      oc_id: ocId,
      subdivision_id: lot.subdivision_id || subdivisionId,
      lot_number: lot.lot_number,
      unit_address: lot.unit_address || null,
      entitlements: lot.entitlements,
      liabilities: lot.liabilities,
      parking: lot.parking || null,
      storage: lot.storage || null,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
}

export async function addPeopleAndMemberships(
  ocId: string,
  data: {
    lot_id: string;
    full_name: string;
    email?: string;
    phone?: string;
    mailing_address?: string;
    ownership_share_percent: number;
    is_primary_contact: boolean;
    role: "owner" | "tenant";
  }[]
) {
  const supabase = await createClient();

  for (const item of data) {
    const { data: person } = await supabase
      .from("people")
      .insert({
        oc_id: ocId,
        full_name: item.full_name,
        email: item.email || null,
        phone: item.phone || null,
        mailing_address: item.mailing_address || null,
      })
      .select()
      .single();

    if (!person) throw new Error("Failed to create person");

    await supabase.from("lot_people").insert({
      lot_id: item.lot_id,
      person_id: person.id,
      role: item.role,
      ownership_share_percent: item.ownership_share_percent,
      is_primary_contact: item.is_primary_contact,
    });
  }

  revalidatePath("/");
}

export async function addCommittee(
  ocId: string,
  data: {
    term_start: string;
    term_end: string;
    members: { person_id: string; position: string; lot_id?: string }[];
  }
) {
  const supabase = await createClient();

  const { data: term } = await supabase
    .from("committee_terms")
    .insert({
      oc_id: ocId,
      term_start: data.term_start,
      term_end: data.term_end,
    })
    .select()
    .single();

  if (!term) throw new Error("Failed to create committee term");

  for (const m of data.members) {
    await supabase.from("committee_members").insert({
      committee_term_id: term.id,
      person_id: m.person_id,
      position: m.position as "chair" | "secretary" | "treasurer" | "member",
      lot_id: m.lot_id || null,
    });
  }

  revalidatePath("/");
}

export async function addFinancialSetup(
  ocId: string,
  data: {
    funds: { name: string; fund_type: "admin" | "capital_works" }[];
    bank_accounts: { name: string; bsb?: string; account_number?: string; fund_id?: string }[];
    chart_accounts: { code: string; name: string; account_type: string; fund_id?: string }[];
  }
) {
  const supabase = await createClient();

  for (const fund of data.funds) {
    await supabase.from("funds").insert({
      oc_id: ocId,
      name: fund.name,
      fund_type: fund.fund_type,
    });
  }

  const { data: funds } = await supabase
    .from("funds")
    .select("id, fund_type")
    .eq("oc_id", ocId)
    .is("deleted_at", null);

  const adminFundId = funds?.find((f) => f.fund_type === "admin")?.id;
  const capitalFundId = funds?.find((f) => f.fund_type === "capital_works")?.id;

  for (const acc of data.bank_accounts) {
    await supabase.from("bank_accounts").insert({
      oc_id: ocId,
      fund_id: acc.fund_id || adminFundId,
      name: acc.name,
      bsb: acc.bsb || null,
      account_number_encrypted: acc.account_number || null,
    });
  }

  for (const ca of data.chart_accounts) {
    await supabase.from("chart_accounts").insert({
      oc_id: ocId,
      fund_id: ca.fund_id || adminFundId,
      code: ca.code,
      name: ca.name,
      account_type: ca.account_type,
    });
  }

  await supabase.from("levy_rules").insert({
    oc_id: ocId,
    interest_rate_per_annum: 10,
    reminder_days: [7, 14, 30],
  });

  await supabase.from("invoice_sequences").insert({
    oc_id: ocId,
    next_number: 1,
  });

  revalidatePath("/");
}
