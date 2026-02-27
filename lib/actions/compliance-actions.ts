"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function exportOcData(ocId: string): Promise<Blob> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bankAccounts } = await supabase
    .from("bank_accounts")
    .select("id")
    .eq("oc_id", ocId)
    .is("deleted_at", null);

  const bankAccountIds = bankAccounts?.map((b) => b.id) ?? [];

  const [oc, lots, people, invoices, transactions, meetings] = await Promise.all([
    supabase.from("oc").select("*").eq("id", ocId).single(),
    supabase.from("lots").select("*").eq("oc_id", ocId).is("deleted_at", null),
    supabase.from("people").select("*").eq("oc_id", ocId).is("deleted_at", null),
    supabase.from("invoices").select("*").eq("oc_id", ocId).is("deleted_at", null),
    bankAccountIds.length > 0
      ? supabase
          .from("bank_transactions")
          .select("*")
          .in("bank_account_id", bankAccountIds)
          .is("deleted_at", null)
      : { data: [] },
    supabase.from("meetings").select("*").eq("oc_id", ocId).is("deleted_at", null),
  ]);

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  const toCsv = (rows: Record<string, unknown>[], headers?: string[]) => {
    const h = headers ?? (rows[0] ? Object.keys(rows[0] as object) : []);
    const lines = [h.join(",")];
    for (const r of rows) {
      lines.push(h.map((k) => JSON.stringify((r as Record<string, unknown>)[k] ?? "")).join(","));
    }
    return lines.join("\n");
  };

  zip.file("oc.json", JSON.stringify(oc.data, null, 2));
  zip.file("lots.csv", toCsv(lots.data ?? []));
  zip.file("people.csv", toCsv(people.data ?? []));
  zip.file("invoices.csv", toCsv(invoices.data ?? []));
  zip.file("transactions.csv", toCsv(transactions.data ?? []));
  zip.file("meetings.csv", toCsv(meetings.data ?? []));

  const blob = await zip.generateAsync({ type: "blob" });
  return blob;
}
