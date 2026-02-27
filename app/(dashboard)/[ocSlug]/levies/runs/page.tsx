import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { notFound } from "next/navigation";

export default async function LevyRunsPage({
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
    .select("*, fund:funds(name)")
    .eq("oc_id", oc.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">Levy Runs</h1>
          <p className="text-muted-foreground">Levy run history</p>
        </div>
        <Link href={`/${ocSlug}/levies/runs/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Levy Run
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {runs?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No levy runs yet</p>
              <Link href={`/${ocSlug}/levies/runs/new`}>
                <Button>Create first levy run</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          runs?.map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {(r.fund as { name?: string })?.name ?? "Fund"} • {formatDate(r.period_start)} - {formatDate(r.period_end)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Due {formatDate(r.due_date)} • {formatCurrency(Number(r.total_amount))}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    r.status === "published" ? "bg-green-500/10 text-green-700" :
                    r.status === "approved" ? "bg-blue-500/10 text-blue-700" :
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  {r.status}
                </span>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
