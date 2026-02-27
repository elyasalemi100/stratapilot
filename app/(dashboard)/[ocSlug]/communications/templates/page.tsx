import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

export default async function EmailTemplatesPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("email_templates")
    .select("id, name, subject, updated_at")
    .or(`oc_id.eq.${oc.id},oc_id.is.null`)
    .is("deleted_at", null)
    .order("name");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <p className="text-muted-foreground">
          Templates for levy notices, reminders, meeting notices
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use placeholders: {"{{owner_name}}"}, {"{{oc_name}}"}, {"{{amount}}"}, {"{{due_date}}"}, {"{{period}}"}, {"{{meeting_title}}"}, {"{{meeting_date}}"}, {"{{location}}"}
          </p>
        </CardHeader>
        <CardContent>
          {templates?.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No templates. Platform defaults are used for levy notice, reminder, and meeting notice.
            </p>
          ) : (
            <div className="space-y-4">
              {templates?.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.subject}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.updated_at).toLocaleDateString()}
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
