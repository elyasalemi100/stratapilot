import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendLevyNoticeEmail({
  to,
  ownerName,
  subject,
  html,
  pdfBuffer,
  invoiceNumber,
}: {
  to: string;
  ownerName: string;
  subject: string;
  html: string;
  pdfBuffer: Buffer;
  invoiceNumber: string;
}) {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "StrataPilot <noreply@stratapilot.com>",
    to,
    subject,
    html,
    attachments: [
      {
        filename: `levy-notice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function sendMeetingNoticeEmail({
  to,
  ownerName,
  subject,
  html,
  pdfBuffer,
  meetingTitle,
}: {
  to: string;
  ownerName: string;
  subject: string;
  html: string;
  pdfBuffer?: Buffer;
  meetingTitle: string;
}) {
  const attachments = pdfBuffer
    ? [
        {
          filename: `meeting-pack-${meetingTitle.replace(/\s+/g, "-")}.pdf`,
          content: pdfBuffer,
        },
      ]
    : undefined;

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "StrataPilot <noreply@stratapilot.com>",
    to,
    subject,
    html,
    attachments,
  });

  if (error) throw new Error(error.message);
  return data;
}
