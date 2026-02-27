import { getOcBySlug } from "@/lib/actions/oc-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { notFound } from "next/navigation";
import { DataExportClient } from "./export-client";

export default async function DataExportPage({
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
        <h1 className="text-3xl font-bold">Data Export</h1>
        <p className="text-muted-foreground">
          Export OC data for backup or migration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Options
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Download data as CSV. Includes lots, owners, invoices, transactions, meetings.
          </p>
        </CardHeader>
        <CardContent>
          <DataExportClient ocId={oc.id} ocSlug={ocSlug} />
        </CardContent>
      </Card>
    </div>
  );
}
