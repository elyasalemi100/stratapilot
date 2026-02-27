import { getOcBySlug } from "@/lib/actions/oc-actions";
import { getDocumentLinks } from "@/lib/actions/document-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { ShareLinksClient } from "./share-links-client";
import { notFound } from "next/navigation";

export default async function ShareLinksPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const links = await getDocumentLinks(oc.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Share Links</h1>
        <p className="text-muted-foreground">
          Token-based links for sharing documents with owners
        </p>
      </div>

      <ShareLinksClient ocSlug={ocSlug} initialLinks={links} />
    </div>
  );
}
