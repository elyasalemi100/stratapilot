"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { Copy, Trash2 } from "lucide-react";
import { revokeDocumentLink } from "@/lib/actions/document-actions";

interface ShareLinksClientProps {
  ocSlug: string;
  initialLinks: {
    id: string;
    token: string;
    expires_at: string;
    created_at: string;
    document?: { file_name?: string; folder?: string } | { file_name?: string; folder?: string }[];
  }[];
}

export function ShareLinksClient({ ocSlug, initialLinks }: ShareLinksClientProps) {
  const [links, setLinks] = useState(initialLinks);
  const [copied, setCopied] = useState<string | null>(null);

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRevoke = async (linkId: string) => {
    await revokeDocumentLink(linkId);
    setLinks((p) => p.filter((l) => l.id !== linkId));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Share Links</CardTitle>
        <p className="text-sm text-muted-foreground">
          Create share links from the Document Library. Links expire after the set period.
        </p>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No share links. Create one from a document in the Document Library.
          </p>
        ) : (
          <div className="space-y-4">
            {links.map((link) => {
              const url = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${link.token}`;
              const isExpired = new Date(link.expires_at) < new Date();
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {(Array.isArray(link.document) ? link.document[0] : link.document)?.file_name ?? "Document"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expires {formatDateTime(link.expires_at)}
                      {isExpired && (
                        <span className="ml-2 text-destructive">(Expired)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyLink(link.token)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {copied === link.token ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevoke(link.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
