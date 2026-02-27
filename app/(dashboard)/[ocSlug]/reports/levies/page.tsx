import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt } from "lucide-react";
import { notFound } from "next/navigation";

export default async function LevyReportsPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();
  const { data: runs } = await supabase
    .from("levy_runs")
    .select("id, period_start, period_end, due_date, total_amount, status")
    .eq("oc_id", oc.id)
    .is("deleted_at", null)
    .order("period_start", { ascending: false })
    .limit(12);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Levy Reports</h1>
        <p className="text-muted-foreground">
          Levy run history
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Levy Runs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {runs?.length === 0 ? (
            <p className="text-muted-foreground">No levy runs</p>
          ) : (
            <div className="space-y-2">
              {runs?.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">
                      {formatDate(r.period_start)} - {formatDate(r.period_end)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due {formatDate(r.due_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(Number(r.total_amount))}</p>
                    <span className="text-xs text-muted-foreground">{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
