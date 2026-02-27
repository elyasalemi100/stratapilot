import { getOcBySlug } from "@/lib/actions/oc-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">OC Settings</h1>
        <p className="text-muted-foreground">
          {oc.name} • {oc.plan_number}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p>{oc.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plan Number</p>
              <p>{oc.plan_number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p>{oc.address ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ABN</p>
              <p>{oc.abn ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">GST Registered</p>
              <p>{oc.gst_registered ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Management Period</p>
              <p>
                {oc.management_start_date ? formatDate(oc.management_start_date) : "—"} to{" "}
                {oc.management_end_date ? formatDate(oc.management_end_date) : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
