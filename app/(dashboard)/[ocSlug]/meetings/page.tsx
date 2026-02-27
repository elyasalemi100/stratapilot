import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { notFound } from "next/navigation";

export default async function MeetingsPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, meeting_type, meeting_date, status")
    .eq("oc_id", oc.id)
    .is("deleted_at", null)
    .order("meeting_date", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meetings</h1>
          <p className="text-muted-foreground">Meeting register</p>
        </div>
        <Link href={`/${ocSlug}/meetings/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Meeting
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {meetings?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No meetings yet</p>
              <Link href={`/${ocSlug}/meetings/new`}>
                <Button>Create first meeting</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          meetings?.map((m) => (
            <Link key={m.id} href={`/${ocSlug}/meetings/${m.id}`}>
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{m.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {m.meeting_type.toUpperCase()} • {formatDateTime(m.meeting_date)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      m.status === "minutes_finalized"
                        ? "bg-green-500/10 text-green-700"
                        : m.status === "notice_sent"
                        ? "bg-blue-500/10 text-blue-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {m.status}
                  </span>
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
