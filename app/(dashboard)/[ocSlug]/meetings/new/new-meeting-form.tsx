"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMeeting, addAgendaItem } from "@/lib/actions/meeting-actions";

interface NewMeetingFormProps {
  ocId: string;
  ocSlug: string;
}

export function NewMeetingForm({ ocId, ocSlug }: NewMeetingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    meetingType: "committee",
    title: "",
    meetingDate: "",
    location: "",
  });
  const [agendaItems, setAgendaItems] = useState<
    { itemType: string; title: string; description: string }[]
  >([{ itemType: "notice", title: "Welcome and Apologies", description: "" }]);

  const addAgenda = () => {
    setAgendaItems((p) => [...p, { itemType: "notice", title: "", description: "" }]);
  };

  const updateAgenda = (i: number, field: string, value: string) => {
    setAgendaItems((p) =>
      p.map((item, j) => (j === i ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const meeting = await createMeeting(ocId, {
        meetingType: formData.meetingType,
        title: formData.title,
        meetingDate: formData.meetingDate,
        location: formData.location || undefined,
      });

      for (let i = 0; i < agendaItems.length; i++) {
        const item = agendaItems[i];
        if (item.title.trim()) {
          await addAgendaItem(meeting.id, {
            sortOrder: i,
            itemType: item.itemType,
            title: item.title,
            description: item.description || undefined,
          });
        }
      }

      router.push(`/${ocSlug}/meetings/${meeting.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Meeting Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label>Type</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
              value={formData.meetingType}
              onChange={(e) => setFormData((p) => ({ ...p, meetingType: e.target.value }))}
            >
              <option value="agm">AGM</option>
              <option value="egm">EGM</option>
              <option value="committee">Committee</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              placeholder="Annual General Meeting 2025"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.meetingDate}
                onChange={(e) => setFormData((p) => ({ ...p, meetingDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                placeholder="Building common room"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {agendaItems.map((item, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <div className="flex gap-4">
                <select
                  className="flex h-9 w-32 rounded-md border border-input bg-background px-2"
                  value={item.itemType}
                  onChange={(e) => updateAgenda(i, "itemType", e.target.value)}
                >
                  <option value="notice">Notice</option>
                  <option value="motion">Motion</option>
                  <option value="report">Report</option>
                </select>
                <Input
                  className="flex-1"
                  placeholder="Agenda item title"
                  value={item.title}
                  onChange={(e) => updateAgenda(i, "title", e.target.value)}
                />
              </div>
              <Input
                placeholder="Description (optional)"
                value={item.description}
                onChange={(e) => updateAgenda(i, "description", e.target.value)}
              />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addAgenda}>
            Add agenda item
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Meeting"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
