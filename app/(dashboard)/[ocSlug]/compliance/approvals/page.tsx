import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { CheckSquare } from "lucide-react";
import { notFound } from "next/navigation";

export default async function ApprovalsPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();

  const [draftLevyRuns, unfinalizedMinutes] = await Promise.all([
    supabase
      .from("levy_runs")
      .select("id, period_start, period_end, due_date, total_amount, created_at")
      .eq("oc_id", oc.id)
      .eq("status", "draft")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("meetings")
      .select("id, title, meeting_date, status")
      .eq("oc_id", oc.id)
      .eq("status", "notice_sent")
      .is("deleted_at", null),
  ]);

  const levyRuns = draftLevyRuns.data ?? [];
  const meetings = unfinalizedMinutes.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Approvals</h1>
        <p className="text-muted-foreground">
          Pending approvals for levy runs and meeting minutes
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Draft Levy Runs
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Approve to publish and send notices
            </p>
          </CardHeader>
          <CardContent>
            {levyRuns.length === 0 ? (
              <p className="text-muted-foreground">No draft levy runs</p>
            ) : (
              <div className="space-y-2">
                {levyRuns.map((r) => (
                  <a
                    key={r.id}
                    href={`/${ocSlug}/levies/runs/new`}
                    className="block rounded-lg border p-4 hover:bg-muted/50"
                  >
                    <p className="font-medium">
                      {formatDate(r.period_start)} - {formatDate(r.period_end)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due {formatDate(r.due_date)} • ${Number(r.total_amount).toLocaleString()}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Minutes to Finalize</CardTitle>
            <p className="text-sm text-muted-foreground">
              Finalize minutes after meetings
            </p>
          </CardHeader>
          <CardContent>
            {meetings.length === 0 ? (
              <p className="text-muted-foreground">No meetings pending minutes</p>
            ) : (
              <div className="space-y-2">
                {meetings.map((m) => (
                  <a
                    key={m.id}
                    href={`/${ocSlug}/meetings/${m.id}`}
                    className="block rounded-lg border p-4 hover:bg-muted/50"
                  >
                    <p className="font-medium">{m.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(m.meeting_date)}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
