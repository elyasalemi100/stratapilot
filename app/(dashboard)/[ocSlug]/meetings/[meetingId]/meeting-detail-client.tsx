"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  generateMeetingPackPdf,
  sendMeetingNotice,
  saveMinutes,
  finalizeMinutes,
} from "@/lib/actions/meeting-actions";
import { FileText, Mail, CheckSquare } from "lucide-react";

interface MeetingDetailClientProps {
  meeting: {
    id: string;
    title: string;
    status: string;
    meeting_type: string;
  };
  agenda: { id: string; item_type: string; title: string; description?: string }[];
  ocSlug: string;
  initialMinutes?: string;
}

export function MeetingDetailClient({ meeting, agenda, ocSlug, initialMinutes = "" }: MeetingDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [minutesContent, setMinutesContent] = useState(initialMinutes || "");

  const handleGeneratePack = async () => {
    setLoading("pack");
    try {
      const buffer = await generateMeetingPackPdf(meeting.id);
      const blob = new Blob([new Uint8Array(buffer)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meeting-pack-${meeting.title.replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleSendNotice = async () => {
    setLoading("send");
    try {
      await sendMeetingNotice(meeting.id);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleSaveMinutes = async () => {
    setLoading("minutes");
    try {
      await saveMinutes(meeting.id, { content: minutesContent });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleFinalize = async () => {
    setLoading("finalize");
    try {
      await finalizeMinutes(meeting.id);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {agenda.map((item, i) => (
              <li key={item.id} className="flex gap-4">
                <span className="font-medium text-muted-foreground w-8">{i + 1}.</span>
                <div>
                  <p className="font-medium">
                    [{item.item_type}] {item.title}
                  </p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleGeneratePack}
            disabled={!!loading}
          >
            <FileText className="h-4 w-4 mr-2" />
            {loading === "pack" ? "Generating..." : "Generate Meeting Pack PDF"}
          </Button>
          <Button
            variant="outline"
            onClick={handleSendNotice}
            disabled={!!loading || meeting.status === "notice_sent"}
          >
            <Mail className="h-4 w-4 mr-2" />
            {loading === "send" ? "Sending..." : "Send Meeting Notice"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Minutes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Record meeting outcomes and votes
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Enter minutes..."
            value={minutesContent}
            onChange={(e) => setMinutesContent(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSaveMinutes}
              disabled={!!loading}
            >
              {loading === "minutes" ? "Saving..." : "Save Minutes"}
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={!!loading || meeting.status === "minutes_finalized"}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {loading === "finalize" ? "Finalizing..." : "Finalize Minutes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
