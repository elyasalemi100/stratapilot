import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

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
  const { data, error } = await getResend().emails.send({
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

export async function sendArrearsReminderEmail({
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
  pdfBuffer?: Buffer;
  invoiceNumber: string;
}) {
  const attachments = pdfBuffer
    ? [{ filename: `invoice-${invoiceNumber}.pdf`, content: pdfBuffer }]
    : undefined;

  const { data, error } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || "StrataPilot <noreply@stratapilot.com>",
    to,
    subject,
    html,
    attachments,
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

  const { data, error } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || "StrataPilot <noreply@stratapilot.com>",
    to,
    subject,
    html,
    attachments,
  });

  if (error) throw new Error(error.message);
  return data;
}
