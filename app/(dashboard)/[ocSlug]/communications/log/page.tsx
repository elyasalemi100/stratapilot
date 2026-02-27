import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Mail, CheckCircle, XCircle } from "lucide-react";
import { notFound } from "next/navigation";

export default async function CommsLogPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();
  const { data: emails } = await supabase
    .from("email_outbox")
    .select("id, recipient_email, recipient_name, subject, status, sent_at, created_at")
    .eq("oc_id", oc.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Comms Log</h1>
        <p className="text-muted-foreground">
          All emails sent for this OC
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History ({emails?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emails?.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No emails sent yet
            </p>
          ) : (
            <div className="space-y-2">
              {emails?.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{e.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      To: {e.recipient_email}
                      {e.recipient_name && ` (${e.recipient_name})`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.status === "sent" || e.status === "delivered" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : e.status === "bounced" || e.status === "failed" ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {e.sent_at ? formatDateTime(e.sent_at) : formatDateTime(e.created_at)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        e.status === "sent" || e.status === "delivered"
                          ? "bg-green-500/10 text-green-700"
                          : e.status === "bounced" || e.status === "failed"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {e.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
