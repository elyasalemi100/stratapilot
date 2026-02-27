import { getOcBySlug } from "@/lib/actions/oc-actions";
import { getDocuments } from "@/lib/actions/document-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { FileStack, FolderOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { DocumentUpload } from "./document-upload";

const FOLDERS = [
  { value: "financial", label: "Financial" },
  { value: "meetings", label: "Meetings" },
  { value: "compliance", label: "Compliance" },
  { value: "contracts", label: "Contracts" },
  { value: "general", label: "General" },
];

export default async function DocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ ocSlug: string }>;
  searchParams: Promise<{ folder?: string }>;
}) {
  const { ocSlug } = await params;
  const { folder } = await searchParams;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const documents = await getDocuments(oc.id, folder);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Document Library</h1>
        <p className="text-muted-foreground">
          Documents for {oc.name}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <a
          href={`/${ocSlug}/documents`}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            !folder ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          All
        </a>
        {FOLDERS.map((f) => (
          <a
            key={f.value}
            href={`/${ocSlug}/documents?folder=${f.value}`}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              folder === f.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileStack className="h-5 w-5" />
            Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DocumentUpload ocId={oc.id} ocSlug={ocSlug} folder={folder || "general"} />
          {documents.length === 0 ? (
            <div className="py-12 text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No documents yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload documents from meetings or the financial section
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <FileStack className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.folder} • {formatDateTime(doc.created_at)}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/api/documents/serve?path=${encodeURIComponent(doc.file_url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
