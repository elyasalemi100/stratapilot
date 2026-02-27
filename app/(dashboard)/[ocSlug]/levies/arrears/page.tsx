import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default async function ArrearsPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      id, invoice_number, due_date, total_amount, amount_paid,
      lot:lots(lot_number, unit_address)
    `)
    .eq("oc_id", oc.id)
    .in("status", ["overdue", "issued"])
    .lt("due_date", new Date().toISOString().split("T")[0])
    .is("deleted_at", null)
    .order("due_date");

  const totalArrears = (invoices ?? []).reduce(
    (sum, inv) => sum + (Number(inv.total_amount) - Number(inv.amount_paid ?? 0)),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Arrears</h1>
        <p className="text-muted-foreground">
          Overdue levy notices • Total: {formatCurrency(totalArrears)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Overdue Invoices ({invoices?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices?.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No arrears</p>
              <p className="mt-1 text-sm text-muted-foreground">All invoices are up to date.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices?.map((inv) => {
                const due = Number(inv.total_amount) - Number(inv.amount_paid ?? 0);
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/30"
                  >
                    <div>
                      <p className="font-medium">
                        {inv.invoice_number} • Lot {Array.isArray(inv.lot) ? inv.lot[0]?.lot_number : (inv.lot as { lot_number?: string })?.lot_number ?? "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due {formatDate(inv.due_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-destructive">{formatCurrency(due)}</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Send reminder
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
