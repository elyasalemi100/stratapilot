import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AlertCircle, Receipt, ArrowLeftRight, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) return null;

  const supabase = await createClient();

  const [arrearsResult, unreconciledResult, upcomingLeviesResult, upcomingMeetingsResult] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("id, total_amount, amount_paid, due_date")
        .eq("oc_id", oc.id)
        .in("status", ["overdue", "issued"])
        .lt("due_date", new Date().toISOString().split("T")[0])
        .is("deleted_at", null),
      supabase
        .from("bank_transactions")
        .select("id", { count: "exact", head: true })
        .is("reconciled_at", null)
        .is("deleted_at", null),
      supabase
        .from("levy_runs")
        .select("id, due_date, total_amount")
        .eq("oc_id", oc.id)
        .gte("due_date", new Date().toISOString().split("T")[0])
        .eq("status", "published")
        .is("deleted_at", null)
        .order("due_date")
        .limit(3),
      supabase
        .from("meetings")
        .select("id, title, meeting_date, meeting_type")
        .eq("oc_id", oc.id)
        .gte("meeting_date", new Date().toISOString())
        .is("deleted_at", null)
        .order("meeting_date")
        .limit(3),
    ]);

  const arrears = arrearsResult.data ?? [];
  const arrearsTotal = arrears.reduce(
    (sum, inv) => sum + (Number(inv.total_amount) - Number(inv.amount_paid)),
    0
  );
  const unreconciledCount = unreconciledResult.count ?? 0;
  const upcomingLevies = upcomingLeviesResult.data ?? [];
  const upcomingMeetings = upcomingMeetingsResult.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{oc.name}</h1>
        <p className="text-muted-foreground">
          {oc.plan_number} • {oc.address}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arrears</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(arrearsTotal)}</div>
            <p className="text-xs text-muted-foreground">
              {arrears.length} overdue invoice{arrears.length !== 1 ? "s" : ""}
            </p>
            <Link href={`/${ocSlug}/levies/arrears`}>
              <Button variant="link" className="h-auto p-0 text-primary">
                View arrears
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unreconciled</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreconciledCount}</div>
            <p className="text-xs text-muted-foreground">transactions</p>
            <Link href={`/${ocSlug}/banking/reconciliation`}>
              <Button variant="link" className="h-auto p-0 text-primary">
                Reconcile
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Levies</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingLevies.length > 0
                ? formatCurrency(Number(upcomingLevies[0].total_amount))
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {upcomingLevies.length > 0
                ? `Due ${formatDate(upcomingLevies[0].due_date)}`
                : "No upcoming levies"}
            </p>
            <Link href={`/${ocSlug}/levies/runs`}>
              <Button variant="link" className="h-auto p-0 text-primary">
                View levy runs
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingMeetings.length > 0 ? upcomingMeetings[0].title : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {upcomingMeetings.length > 0
                ? formatDate(upcomingMeetings[0].meeting_date)
                : "No upcoming meetings"}
            </p>
            <Link href={`/${ocSlug}/meetings`}>
              <Button variant="link" className="h-auto p-0 text-primary">
                View meetings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardContent className="p-0 pt-4">
              <div className="flex flex-wrap gap-2">
                <Link href={`/${ocSlug}/levies/runs/new`}>
                  <Button>New levy run</Button>
                </Link>
                <Link href={`/${ocSlug}/banking/import`}>
                  <Button variant="outline">Import bank CSV</Button>
                </Link>
                <Link href={`/${ocSlug}/meetings`}>
                  <Button variant="outline">Schedule meeting</Button>
                </Link>
              </div>
            </CardContent>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Setup Status</CardTitle>
            <CardContent className="p-0 pt-4">
              <Link href={`/${ocSlug}/setup`}>
                <Button variant="outline">Complete OC setup wizard</Button>
              </Link>
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
