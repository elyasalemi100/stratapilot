import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { BankingImportClient } from "./import-client";
import { notFound } from "next/navigation";

export default async function BankingImportPage({
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

  return <BankingImportClient bankAccounts={bankAccounts ?? []} />;
}
