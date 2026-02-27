"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import React from "react";
import { pdf } from "@react-pdf/renderer";
import { MeetingPackPdfDocument } from "@/lib/utils/pdf/meeting-pack-pdf";
import { sendMeetingNoticeEmail } from "@/lib/utils/email";

export async function createMeeting(ocId: string, data: {
  meetingType: string;
  title: string;
  meetingDate: string;
  location?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meeting, error } = await supabase
    .from("meetings")
    .insert({
      oc_id: ocId,
      meeting_type: data.meetingType as "agm" | "egm" | "committee",
      title: data.title,
      meeting_date: data.meetingDate,
      location: data.location || null,
      status: "draft",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return meeting;
}

export async function addAgendaItem(meetingId: string, data: {
  sortOrder: number;
  itemType: string;
  title: string;
  description?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("meeting_agenda_items").insert({
    meeting_id: meetingId,
    sort_order: data.sortOrder,
    item_type: data.itemType,
    title: data.title,
    description: data.description || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function generateMeetingPackPdf(meetingId: string): Promise<Buffer> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*, oc:oc(*), agenda:meeting_agenda_items(*)")
    .eq("id", meetingId)
    .single();

  if (!meeting) throw new Error("Meeting not found");

  const oc = meeting.oc as { name: string };
  const agendaItems = (meeting.agenda ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );

  const doc = React.createElement(MeetingPackPdfDocument, {
    ocName: oc.name,
    meetingTitle: meeting.title,
    meetingType: meeting.meeting_type,
    meetingDate: meeting.meeting_date,
    location: meeting.location,
    agendaItems: agendaItems.map((a: { item_type: string; title: string; description?: string }) => ({
      item_type: a.item_type,
      title: a.title,
      description: a.description,
    })),
  }) as React.ReactElement;

  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function sendMeetingNotice(meetingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*, oc:oc(*)")
    .eq("id", meetingId)
    .single();

  if (!meeting) throw new Error("Meeting not found");

  const { data: lots } = await supabase
    .from("lots")
    .select("id")
    .eq("oc_id", meeting.oc_id)
    .is("deleted_at", null);

  const lotIds = lots?.map((l) => l.id) ?? [];
  const recipients = new Map<string, string>();

  if (lotIds.length > 0) {
    const { data: lotPeople } = await supabase
      .from("lot_people")
      .select("person_id")
      .in("lot_id", lotIds)
      .eq("is_primary_contact", true)
      .is("deleted_at", null);

    const personIds = [...new Set((lotPeople ?? []).map((lp) => lp.person_id))];
    if (personIds.length > 0) {
      const { data: people } = await supabase
        .from("people")
        .select("full_name, email")
        .in("id", personIds)
        .is("deleted_at", null);

      for (const p of people ?? []) {
        if (p.email) recipients.set(p.email, p.full_name || "Owner");
      }
    }
  }

  const oc = meeting.oc as { name: string };

  let pdfBuffer: Buffer | undefined;
  try {
    pdfBuffer = await generateMeetingPackPdf(meetingId);
  } catch {
    // Continue without PDF
  }

  const subject = `Meeting Notice: ${meeting.title}`;
  const meetingDate = new Date(meeting.meeting_date).toLocaleString("en-AU", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const results: { email: string; success: boolean }[] = [];

  for (const [email, name] of recipients) {
    try {
      const html = `
        <p>Dear ${name},</p>
        <p>You are invited to <strong>${meeting.title}</strong>.</p>
        <p><strong>Date:</strong> ${meetingDate}</p>
        <p><strong>Location:</strong> ${meeting.location || "TBC"}</p>
        <p>Please find the meeting pack attached.</p>
      `;

      await sendMeetingNoticeEmail({
        to: email,
        ownerName: name,
        subject,
        html,
        pdfBuffer,
        meetingTitle: meeting.title,
      });

      await supabase.from("email_outbox").insert({
        oc_id: meeting.oc_id,
        recipient_email: email,
        recipient_name: name,
        subject,
        status: "sent",
        meeting_id: meetingId,
        sent_at: new Date().toISOString(),
      });

      results.push({ email, success: true });
    } catch {
      results.push({ email, success: false });
    }
  }

  await supabase
    .from("meetings")
    .update({ status: "notice_sent" })
    .eq("id", meetingId);

  revalidatePath("/");
  return results;
}

export async function saveMinutes(meetingId: string, content: Record<string, unknown>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("meeting_minutes")
    .select("id")
    .eq("meeting_id", meetingId)
    .single();

  if (existing) {
    await supabase
      .from("meeting_minutes")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("meeting_minutes").insert({
      meeting_id: meetingId,
      content,
    });
  }

  revalidatePath("/");
}

export async function finalizeMinutes(meetingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("meeting_minutes")
    .update({
      finalized_at: new Date().toISOString(),
      finalized_by: user.id,
    })
    .eq("meeting_id", meetingId);

  await supabase
    .from("meetings")
    .update({ status: "minutes_finalized" })
    .eq("id", meetingId);

  revalidatePath("/");
}
