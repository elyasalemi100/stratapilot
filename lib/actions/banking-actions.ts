"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createHash } from "crypto";

export interface CsvColumnMapping {
  date: string;
  description: string;
  amount: string;
  debit?: string;
  credit?: string;
  balance?: string;
}

export async function importBankTransactions(
  bankAccountId: string,
  rows: Record<string, string>[],
  mapping: CsvColumnMapping
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: account } = await supabase
    .from("bank_accounts")
    .select("oc_id")
    .eq("id", bankAccountId)
    .single();

  if (!account) throw new Error("Bank account not found");

  const parseAmount = (row: Record<string, string>): { amount: number; type: "debit" | "credit" } => {
    if (mapping.amount && mapping.amount.trim()) {
      const val = parseFloat(String(row[mapping.amount] ?? 0).replace(/[^0-9.-]/g, "")) || 0;
      return { amount: Math.abs(val), type: val >= 0 ? "credit" : "debit" };
    }
    const debit = parseFloat(String(row[mapping.debit ?? ""] ?? 0).replace(/[^0-9.-]/g, "")) || 0;
    const credit = parseFloat(String(row[mapping.credit ?? ""] ?? 0).replace(/[^0-9.-]/g, "")) || 0;
    if (credit > 0) return { amount: credit, type: "credit" };
    return { amount: debit, type: "debit" };
  };

  const parseDate = (val: string): string => {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  let imported = 0;
  for (const row of rows) {
    const dateStr = mapping.date ? parseDate(String(row[mapping.date] ?? "")) : "";
    if (!dateStr) continue;

    const desc = mapping.description ? String(row[mapping.description] ?? "").trim() : "";
    const { amount, type } = parseAmount(row);

    const externalId = createHash("md5")
      .update(`${bankAccountId}-${dateStr}-${desc}-${amount}-${type}`)
      .digest("hex");

    const { data: existing } = await supabase
      .from("bank_transactions")
      .select("id")
      .eq("external_id", externalId)
      .single();

    if (existing) continue;

    await supabase.from("bank_transactions").insert({
      bank_account_id: bankAccountId,
      transaction_date: dateStr,
      description: desc,
      amount,
      transaction_type: type,
      external_id: externalId,
    });
    imported++;
  }

  revalidatePath("/");
  return { imported, total: rows.length };
}

export async function matchTransactionToInvoice(
  transactionId: string,
  invoiceId: string,
  amount: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: inv } = await supabase
    .from("invoices")
    .select("oc_id, total_amount, amount_paid")
    .eq("id", invoiceId)
    .single();

  if (!inv) throw new Error("Invoice not found");

  const { data: txn } = await supabase
    .from("bank_transactions")
    .select("bank_account_id, transaction_date")
    .eq("id", transactionId)
    .single();

  if (!txn) throw new Error("Transaction not found");

  const { data: acct } = await supabase
    .from("bank_accounts")
    .select("oc_id")
    .eq("id", txn.bank_account_id)
    .single();

  if (acct?.oc_id !== inv.oc_id) throw new Error("OC mismatch");

  const { data: payment } = await supabase
    .from("payments")
    .insert({
      oc_id: inv.oc_id,
      amount,
      payment_date: txn.transaction_date,
      reference: `Invoice ${invoiceId}`,
      status: "completed",
      bank_transaction_id: transactionId,
    })
    .select()
    .single();

  if (!payment) throw new Error("Failed to create payment");

  await supabase.from("invoice_payments").insert({
    invoice_id: invoiceId,
    payment_id: payment.id,
    amount,
  });

  const currentPaid = Number(inv.amount_paid ?? 0);
  const newPaid = currentPaid + amount;
  const total = Number(inv.total_amount ?? 0);
  const newStatus = newPaid >= total ? "paid" : "partially_paid";

  await supabase
    .from("invoices")
    .update({ amount_paid: newPaid, status: newStatus })
    .eq("id", invoiceId);

  await supabase
    .from("bank_transactions")
    .update({ reconciled_at: new Date().toISOString() })
    .eq("id", transactionId);

  await supabase.from("transaction_allocations").insert({
    bank_transaction_id: transactionId,
    invoice_id: invoiceId,
    amount,
  });

  revalidatePath("/");
}

export async function unmatchTransaction(transactionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: allocs } = await supabase
    .from("transaction_allocations")
    .select("invoice_id, amount, payment_id")
    .eq("bank_transaction_id", transactionId);

  for (const a of allocs ?? []) {
    const { data: inv } = await supabase
      .from("invoices")
      .select("amount_paid, total_amount")
      .eq("id", a.invoice_id)
      .single();

    if (inv) {
      const newPaid = Math.max(0, Number(inv.amount_paid) - Number(a.amount));
      const total = Number(inv.total_amount);
      const newStatus = newPaid <= 0 ? "issued" : newPaid >= total ? "paid" : "partially_paid";
      await supabase
        .from("invoices")
        .update({ amount_paid: newPaid, status: newStatus })
        .eq("id", a.invoice_id);
    }

    await supabase.from("invoice_payments").delete().eq("payment_id", a.payment_id);
    await supabase.from("payments").delete().eq("id", a.payment_id);
  }

  await supabase
    .from("transaction_allocations")
    .delete()
    .eq("bank_transaction_id", transactionId);

  await supabase
    .from("bank_transactions")
    .update({ reconciled_at: null })
    .eq("id", transactionId);

  revalidatePath("/");
}
