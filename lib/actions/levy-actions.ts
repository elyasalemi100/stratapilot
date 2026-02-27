"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { generateInvoicePdf } from "@/lib/utils/pdf";
import { sendLevyNoticeEmail } from "@/lib/utils/email";
import { formatDate } from "@/lib/utils";

export async function createLevyRun(ocId: string, data: {
  fundId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  totalAmount: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: run, error } = await supabase
    .from("levy_runs")
    .insert({
      oc_id: ocId,
      fund_id: data.fundId,
      period_start: data.periodStart,
      period_end: data.periodEnd,
      due_date: data.dueDate,
      total_amount: data.totalAmount,
      status: "draft",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return run;
}

export async function generateInvoicesForLevyRun(levyRunId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: run } = await supabase
    .from("levy_runs")
    .select("*, oc:oc(*), fund:funds(*)")
    .eq("id", levyRunId)
    .single();

  if (!run) throw new Error("Levy run not found");

  const { data: lots } = await supabase
    .from("lots")
    .select("id, lot_number, unit_address, entitlements")
    .eq("oc_id", run.oc_id)
    .is("deleted_at", null);

  if (!lots || lots.length === 0) throw new Error("No lots found");

  const totalEntitlements = lots.reduce((s, l) => s + l.entitlements, 0);
  const totalAmount = Number(run.total_amount);

  const { data: seq } = await supabase
    .from("invoice_sequences")
    .select("next_number")
    .eq("oc_id", run.oc_id)
    .single();

  let nextNum = seq?.next_number ?? 1;

  for (const lot of lots) {
    const amount = (lot.entitlements / totalEntitlements) * totalAmount;
    const invoiceNumber = `INV-${String(nextNum).padStart(3, "0")}`;

    await supabase.from("invoices").insert({
      oc_id: run.oc_id,
      levy_run_id: levyRunId,
      lot_id: lot.id,
      invoice_number: invoiceNumber,
      status: "draft",
      due_date: run.due_date,
      total_amount: amount,
      amount_paid: 0,
    });

    const { data: inv } = await supabase
      .from("invoices")
      .select("id")
      .eq("oc_id", run.oc_id)
      .eq("invoice_number", invoiceNumber)
      .single();

    if (inv) {
      await supabase.from("invoice_line_items").insert({
        invoice_id: inv.id,
        fund_id: run.fund_id,
        description: `${(run.fund as { name?: string })?.name || "Levy"} ${run.period_start} - ${run.period_end}`,
        amount,
      });
    }

    nextNum++;
  }

  await supabase
    .from("invoice_sequences")
    .update({ next_number: nextNum, updated_at: new Date().toISOString() })
    .eq("oc_id", run.oc_id);

  revalidatePath("/");
  return { count: lots.length };
}

export async function approveLevyRun(levyRunId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("levy_runs")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq("id", levyRunId);

  await supabase
    .from("invoices")
    .update({ status: "issued" })
    .eq("levy_run_id", levyRunId);

  revalidatePath("/");
}

export async function sendLevyNotices(levyRunId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: run } = await supabase
    .from("levy_runs")
    .select("*, oc:oc(*), fund:funds(*)")
    .eq("id", levyRunId)
    .single();

  if (!run) throw new Error("Levy run not found");

  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      *,
      lot:lots(*),
      line_items:invoice_line_items(*)
    `)
    .eq("levy_run_id", levyRunId)
    .eq("status", "issued");

  if (!invoices || invoices.length === 0) throw new Error("No invoices to send");

  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select("bsb, account_number_encrypted, name")
    .eq("oc_id", run.oc_id)
    .is("deleted_at", null)
    .limit(1)
    .single();

  const bankDetails = bankAccount
    ? {
        bsb: bankAccount.bsb || "",
        account: bankAccount.account_number_encrypted || "",
        name: bankAccount.name || "",
      }
    : undefined;

  const oc = run.oc as { name: string; plan_number: string; address?: string };
  const results: { invoiceId: string; success: boolean; error?: string }[] = [];

  for (const inv of invoices) {
    const lot = inv.lot as { lot_number: string; unit_address?: string };
    const primaryOwner = await supabase
      .from("lot_people")
      .select("person_id")
      .eq("lot_id", inv.lot_id)
      .eq("is_primary_contact", true)
      .limit(1)
      .single();

    let person: { full_name: string; email?: string; mailing_address?: string } | null = null;
    if (primaryOwner.data?.person_id) {
      const personRes = await supabase
        .from("people")
        .select("full_name, email, mailing_address")
        .eq("id", primaryOwner.data.person_id)
        .single();
      person = personRes.data as { full_name: string; email?: string; mailing_address?: string } | null;
    }
    if (!person) {
      const anyOwner = await supabase
        .from("lot_people")
        .select("person_id")
        .eq("lot_id", inv.lot_id)
        .limit(1)
        .single();
      if (anyOwner.data?.person_id) {
        const personRes = await supabase
          .from("people")
          .select("full_name, email, mailing_address")
          .eq("id", anyOwner.data.person_id)
          .single();
        person = personRes.data as { full_name: string; email?: string; mailing_address?: string } | null;
      }
    }
    const ownerName = person?.full_name || "Owner";
    const ownerEmail = person?.email;

    if (!ownerEmail) {
      results.push({ invoiceId: inv.id, success: false, error: "No email" });
      continue;
    }

    const lineItems = (inv.line_items ?? []).map((li: { description: string; amount: number }) => ({
      description: li.description,
      amount: Number(li.amount),
    }));

    if (lineItems.length === 0) {
      lineItems.push({
        description: "Levy",
        amount: Number(inv.total_amount),
      });
    }

    try {
      const pdfBuffer = await generateInvoicePdf({
        ocName: oc.name,
        ocPlanNumber: oc.plan_number,
        ocAddress: oc.address,
        invoiceNumber: inv.invoice_number,
        dueDate: inv.due_date,
        lotNumber: lot.lot_number,
        unitAddress: lot.unit_address,
        ownerName,
        ownerAddress: person?.mailing_address,
        lineItems,
        totalAmount: Number(inv.total_amount),
        bankDetails,
      });

      const subject = `Levy Notice - ${oc.name} - ${inv.invoice_number}`;
      const html = `
        <p>Dear ${ownerName},</p>
        <p>Please find your levy notice for ${run.period_start} to ${run.period_end} attached.</p>
        <p><strong>Due date:</strong> ${formatDate(inv.due_date)}</p>
        <p><strong>Amount:</strong> $${Number(inv.total_amount).toFixed(2)}</p>
        <p>Please use invoice number ${inv.invoice_number} as your payment reference.</p>
      `;

      await sendLevyNoticeEmail({
        to: ownerEmail,
        ownerName,
        subject,
        html,
        pdfBuffer,
        invoiceNumber: inv.invoice_number,
      });

      await supabase.from("email_outbox").insert({
        oc_id: run.oc_id,
        recipient_email: ownerEmail,
        recipient_name: ownerName,
        subject,
        status: "sent",
        invoice_id: inv.id,
        sent_at: new Date().toISOString(),
      });

      results.push({ invoiceId: inv.id, success: true });
    } catch (err) {
      results.push({
        invoiceId: inv.id,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  revalidatePath("/");
  return results;
}

export async function updateOverdueInvoices(ocId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  await supabase
    .from("invoices")
    .update({ status: "overdue" })
    .eq("oc_id", ocId)
    .eq("status", "issued")
    .lt("due_date", today)
    .is("deleted_at", null);
}

export async function sendArrearsReminder(invoiceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: inv } = await supabase
    .from("invoices")
    .select(`
      *,
      oc:oc(*),
      lot:lots(*),
      line_items:invoice_line_items(*)
    `)
    .eq("id", invoiceId)
    .single();

  if (!inv) throw new Error("Invoice not found");

  const primaryOwner = await supabase
    .from("lot_people")
    .select("person_id")
    .eq("lot_id", inv.lot_id)
    .eq("is_primary_contact", true)
    .limit(1)
    .single();

  let person: { full_name: string; email?: string } | null = null;
  if (primaryOwner.data?.person_id) {
    const r = await supabase
      .from("people")
      .select("full_name, email")
      .eq("id", primaryOwner.data.person_id)
      .single();
    person = r.data as { full_name: string; email?: string } | null;
  }
  if (!person?.email) throw new Error("No email for owner");

  const oc = inv.oc as { name: string; plan_number: string; address?: string };
  const lineItems = (inv.line_items ?? []).map((li: { description: string; amount: number }) => ({
    description: li.description,
    amount: Number(li.amount),
  }));
  if (lineItems.length === 0) {
    lineItems.push({ description: "Levy", amount: Number(inv.total_amount) });
  }

  const pdfBuffer = await generateInvoicePdf({
    ocName: oc.name,
    ocPlanNumber: oc.plan_number,
    ocAddress: oc.address,
    invoiceNumber: inv.invoice_number,
    dueDate: inv.due_date,
    lotNumber: (inv.lot as { lot_number?: string })?.lot_number ?? "",
    ownerName: person.full_name,
    lineItems,
    totalAmount: Number(inv.total_amount),
  });

  const { sendArrearsReminderEmail } = await import("@/lib/utils/email");
  await sendArrearsReminderEmail({
    to: person.email,
    ownerName: person.full_name,
    subject: `Reminder: Overdue Levy - ${inv.invoice_number}`,
    html: `
      <p>Dear ${person.full_name},</p>
      <p>This is a reminder that your levy invoice ${inv.invoice_number} is overdue.</p>
      <p><strong>Amount due:</strong> $${(Number(inv.total_amount) - Number(inv.amount_paid ?? 0)).toFixed(2)}</p>
      <p>Please arrange payment as soon as possible.</p>
    `,
    pdfBuffer,
    invoiceNumber: inv.invoice_number,
  });

  await supabase.from("email_outbox").insert({
    oc_id: inv.oc_id,
    recipient_email: person.email,
    recipient_name: person.full_name,
    subject: `Reminder: Overdue Levy - ${inv.invoice_number}`,
    status: "sent",
    invoice_id: inv.id,
    sent_at: new Date().toISOString(),
  });

  revalidatePath("/");
  return { success: true };
}

export async function downloadInvoicePdf(invoiceId: string): Promise<Buffer> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: inv } = await supabase
    .from("invoices")
    .select(`
      *,
      oc:oc(*),
      lot:lots(*),
      line_items:invoice_line_items(*)
    `)
    .eq("id", invoiceId)
    .single();

  if (!inv) throw new Error("Invoice not found");

  const primaryOwner = await supabase
    .from("lot_people")
    .select("person_id")
    .eq("lot_id", inv.lot_id)
    .eq("is_primary_contact", true)
    .limit(1)
    .single();

  let ownerName = "Owner";
  if (primaryOwner.data?.person_id) {
    const r = await supabase
      .from("people")
      .select("full_name")
      .eq("id", primaryOwner.data.person_id)
      .single();
    ownerName = (r.data as { full_name?: string })?.full_name ?? "Owner";
  }

  const oc = inv.oc as { name: string; plan_number: string; address?: string };
  const lineItems = (inv.line_items ?? []).map((li: { description: string; amount: number }) => ({
    description: li.description,
    amount: Number(li.amount),
  }));
  if (lineItems.length === 0) {
    lineItems.push({ description: "Levy", amount: Number(inv.total_amount) });
  }

  return generateInvoicePdf({
    ocName: oc.name,
    ocPlanNumber: oc.plan_number,
    ocAddress: oc.address,
    invoiceNumber: inv.invoice_number,
    dueDate: inv.due_date,
    lotNumber: (inv.lot as { lot_number?: string })?.lot_number ?? "",
    ownerName,
    lineItems,
    totalAmount: Number(inv.total_amount),
  });
}
