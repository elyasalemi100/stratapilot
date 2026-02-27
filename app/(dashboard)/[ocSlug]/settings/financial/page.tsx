import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark } from "lucide-react";
import { notFound } from "next/navigation";

export default async function FinancialSetupPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();
  const [funds, bankAccounts, chartAccounts] = await Promise.all([
    supabase.from("funds").select("id, name, fund_type").eq("oc_id", oc.id).is("deleted_at", null),
    supabase.from("bank_accounts").select("id, name, bsb").eq("oc_id", oc.id).is("deleted_at", null),
    supabase.from("chart_accounts").select("id, code, name, account_type").eq("oc_id", oc.id).is("deleted_at", null),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Financial Setup</h1>
        <p className="text-muted-foreground">
          Funds, bank accounts, chart of accounts
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Funds
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(funds.data ?? []).length === 0 ? (
              <p className="text-muted-foreground">No funds</p>
            ) : (
              <ul className="space-y-2">
                {(funds.data ?? []).map((f) => (
                  <li key={f.id} className="flex justify-between">
                    <span>{f.name}</span>
                    <span className="text-muted-foreground text-sm">{f.fund_type}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {(bankAccounts.data ?? []).length === 0 ? (
              <p className="text-muted-foreground">No bank accounts</p>
            ) : (
              <ul className="space-y-2">
                {(bankAccounts.data ?? []).map((b) => (
                  <li key={b.id}>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-sm text-muted-foreground">{b.bsb ?? "—"}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chart of Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {(chartAccounts.data ?? []).length === 0 ? (
              <p className="text-muted-foreground">No chart accounts</p>
            ) : (
              <ul className="space-y-2">
                {(chartAccounts.data ?? []).map((c) => (
                  <li key={c.id} className="flex justify-between text-sm">
                    <span>{c.code} {c.name}</span>
                    <span className="text-muted-foreground">{c.account_type}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
