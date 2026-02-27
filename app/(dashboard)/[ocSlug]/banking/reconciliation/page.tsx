import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { ReconciliationClient } from "./reconciliation-client";
import { notFound } from "next/navigation";

export default async function ReconciliationPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();

  const { data: bankAccounts } = await supabase
    .from("bank_accounts")
    .select("id, name")
    .eq("oc_id", oc.id)
    .is("deleted_at", null);

  const bankAccountIds = bankAccounts?.map((b) => b.id) ?? [];

  const [unreconciledTxns, unmatchedInvoices] = await Promise.all([
    bankAccountIds.length > 0
      ? supabase
          .from("bank_transactions")
          .select("id, transaction_date, description, amount, transaction_type")
          .in("bank_account_id", bankAccountIds)
          .is("reconciled_at", null)
          .is("deleted_at", null)
          .order("transaction_date", { ascending: false })
          .limit(100)
      : { data: [] },
    supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        total_amount,
        amount_paid,
        due_date,
        lot:lots(lot_number, unit_address)
      `)
      .eq("oc_id", oc.id)
      .in("status", ["issued", "partially_paid", "overdue"])
      .is("deleted_at", null)
      .order("due_date"),
  ]);

  const transactions = unreconciledTxns.data ?? [];
  const invoices = unmatchedInvoices.data ?? [];

  return (
    <ReconciliationClient
      ocSlug={ocSlug}
      bankAccounts={bankAccounts ?? []}
      transactions={transactions}
      invoices={invoices}
    />
  );
}
