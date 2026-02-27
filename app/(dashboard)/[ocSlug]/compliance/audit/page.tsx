import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Shield } from "lucide-react";
import { notFound } from "next/navigation";

export default async function AuditLogPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_log")
    .select("id, action, entity_type, entity_id, created_at")
    .eq("oc_id", oc.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">
          Immutable record of key actions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs?.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No audit entries yet
            </p>
          ) : (
            <div className="space-y-2">
              {logs?.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {log.action} {log.entity_type}
                    </p>
                    {log.entity_id && (
                      <p className="text-sm text-muted-foreground font-mono">
                        {log.entity_id}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
