import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { notFound } from "next/navigation";

export default async function UpcomingMeetingsPage({
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
    .select("id, title, meeting_type, meeting_date, location, status")
    .eq("oc_id", oc.id)
    .gte("meeting_date", new Date().toISOString())
    .is("deleted_at", null)
    .order("meeting_date");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Upcoming Meetings</h1>
        <p className="text-muted-foreground">
          Future meetings for {oc.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meetings?.length === 0 ? (
            <p className="text-muted-foreground">No upcoming meetings</p>
          ) : (
            <div className="space-y-2">
              {meetings?.map((m) => (
                <Link key={m.id} href={`/${ocSlug}/meetings/${m.id}`}>
                  <div className="rounded-lg border p-4 hover:bg-muted/50">
                    <p className="font-medium">{m.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.meeting_type.toUpperCase()} • {formatDateTime(m.meeting_date)}
                      {m.location && ` • ${m.location}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
