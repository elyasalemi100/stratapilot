import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-6">
        <h1 className="text-3xl font-bold tracking-tight">{oc.name}</h1>
        <p className="mt-1 text-muted-foreground">
          {oc.plan_number} • {oc.address}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href={`/${ocSlug}/levies/arrears`}>
          <Card className="card-hover h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Arrears</CardTitle>
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(arrearsTotal)}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {arrears.length} overdue invoice{arrears.length !== 1 ? "s" : ""}
              </p>
              <span className="mt-2 inline-block text-sm font-medium text-primary">
                View arrears →
              </span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${ocSlug}/banking/reconciliation`}>
          <Card className="card-hover h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unreconciled</CardTitle>
              <div className="rounded-full bg-muted p-2">
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreconciledCount}</div>
              <p className="mt-1 text-xs text-muted-foreground">transactions</p>
              <span className="mt-2 inline-block text-sm font-medium text-primary">
                Reconcile →
              </span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${ocSlug}/levies/runs`}>
          <Card className="card-hover h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Levies</CardTitle>
              <div className="rounded-full bg-muted p-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {upcomingLevies.length > 0
                  ? formatCurrency(Number(upcomingLevies[0].total_amount))
                  : "—"}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {upcomingLevies.length > 0
                  ? `Due ${formatDate(upcomingLevies[0].due_date)}`
                  : "No upcoming levies"}
              </p>
              <span className="mt-2 inline-block text-sm font-medium text-primary">
                View levy runs →
              </span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${ocSlug}/meetings`}>
          <Card className="card-hover h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
              <div className="rounded-full bg-muted p-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">
                {upcomingMeetings.length > 0 ? upcomingMeetings[0].title : "—"}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {upcomingMeetings.length > 0
                  ? formatDate(upcomingMeetings[0].meeting_date)
                  : "No upcoming meetings"}
              </p>
              <span className="mt-2 inline-block text-sm font-medium text-primary">
                View meetings →
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for this OC</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href={`/${ocSlug}/levies/runs/new`}>
                <Button className="shadow-sm">New levy run</Button>
              </Link>
              <Link href={`/${ocSlug}/banking/import`}>
                <Button variant="outline">Import bank CSV</Button>
              </Link>
              <Link href={`/${ocSlug}/meetings/new`}>
                <Button variant="outline">Schedule meeting</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Setup Status</CardTitle>
            <CardDescription>Complete setup to unlock all features</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${ocSlug}/setup`}>
              <Button variant="outline" className="w-full sm:w-auto">
                Complete OC setup wizard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
