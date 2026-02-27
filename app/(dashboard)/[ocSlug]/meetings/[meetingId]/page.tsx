import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MeetingDetailClient } from "./meeting-detail-client";
import { formatDateTime } from "@/lib/utils";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ ocSlug: string; meetingId: string }>;
}) {
  const { ocSlug, meetingId } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();
  const { data: meeting } = await supabase
    .from("meetings")
    .select("*, agenda:meeting_agenda_items(*), minutes:meeting_minutes(*)")
    .eq("id", meetingId)
    .eq("oc_id", oc.id)
    .single();

  if (!meeting) notFound();

  const agenda = (meeting.agenda ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{meeting.title}</h1>
        <p className="text-muted-foreground">
          {meeting.meeting_type.toUpperCase()} • {formatDateTime(meeting.meeting_date)}
          {meeting.location && ` • ${meeting.location}`}
        </p>
      </div>

      <MeetingDetailClient
        meeting={meeting}
        agenda={agenda}
        ocSlug={ocSlug}
        initialMinutes={(() => {
          const m = (meeting.minutes as { content?: unknown }[])?.[0];
          if (!m?.content) return "";
          return typeof m.content === "string" ? m.content : (m.content as { content?: string })?.content ?? "";
        })()}
      />
    </div>
  );
}
