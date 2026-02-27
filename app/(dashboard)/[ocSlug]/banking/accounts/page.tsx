import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark } from "lucide-react";
import { notFound } from "next/navigation";

export default async function BankAccountsPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("bank_accounts")
    .select("id, name, bsb, bank_name, fund:funds(name)")
    .eq("oc_id", oc.id)
    .is("deleted_at", null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bank Accounts</h1>
        <p className="text-muted-foreground">
          Bank accounts for {oc.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accounts?.length === 0 ? (
            <p className="text-muted-foreground">No bank accounts. Complete financial setup.</p>
          ) : (
            <div className="space-y-4">
              {accounts?.map((a) => (
                <div key={a.id} className="rounded-lg border p-4">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-muted-foreground">
                    BSB: {a.bsb ?? "—"} • {(a.fund as { name?: string })?.name ?? "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
