import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeftRight } from "lucide-react";
import { notFound } from "next/navigation";

export default async function TransactionsPage({
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
    .select("id")
    .eq("oc_id", oc.id)
    .is("deleted_at", null);

  const bankAccountIds = bankAccounts?.map((b) => b.id) ?? [];
  const { data: transactions } = bankAccountIds.length > 0
    ? await supabase
        .from("bank_transactions")
        .select("id, transaction_date, description, amount, transaction_type, reconciled_at")
        .in("bank_account_id", bankAccountIds)
        .is("deleted_at", null)
        .order("transaction_date", { ascending: false })
        .limit(100)
    : { data: [] };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">
          Bank transactions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(transactions ?? []).length === 0 ? (
            <p className="text-muted-foreground">No transactions. Import a bank statement.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Amount</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(transactions ?? []).map((t) => (
                    <tr key={t.id} className="border-b">
                      <td className="py-2">{formatDate(t.transaction_date)}</td>
                      <td className="py-2">{t.description ?? "—"}</td>
                      <td className={`py-2 text-right ${t.transaction_type === "credit" ? "text-green-600" : ""}`}>
                        {t.transaction_type === "credit" ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="py-2">
                        {t.reconciled_at ? (
                          <span className="text-green-600 text-xs">Reconciled</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
