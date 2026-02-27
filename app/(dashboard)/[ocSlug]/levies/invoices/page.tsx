import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt } from "lucide-react";
import { notFound } from "next/navigation";

export default async function InvoicesPage({
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
      id, invoice_number, status, due_date, total_amount, amount_paid,
      lot:lots(lot_number)
    `)
    .eq("oc_id", oc.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Invoices</h1>
        <p className="text-muted-foreground">
          Levy notices and invoices
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoice List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices?.length === 0 ? (
            <p className="text-muted-foreground">No invoices yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Invoice</th>
                    <th className="text-left py-2">Lot</th>
                    <th className="text-left py-2">Due Date</th>
                    <th className="text-right py-2">Amount</th>
                    <th className="text-right py-2">Paid</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices?.map((inv) => (
                    <tr key={inv.id} className="border-b">
                      <td className="py-2 font-medium">{inv.invoice_number}</td>
                      <td className="py-2">
                        {Array.isArray(inv.lot) ? inv.lot[0]?.lot_number : (inv.lot as { lot_number?: string })?.lot_number ?? "—"}
                      </td>
                      <td className="py-2">{formatDate(inv.due_date)}</td>
                      <td className="py-2 text-right">{formatCurrency(Number(inv.total_amount))}</td>
                      <td className="py-2 text-right">{formatCurrency(Number(inv.amount_paid ?? 0))}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            inv.status === "paid" ? "bg-green-500/10 text-green-700" :
                            inv.status === "overdue" ? "bg-destructive/10 text-destructive" :
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          PDF
                        </a>
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
