import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";

export default async function ShareDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // Use service role to bypass RLS - share links work for unauthenticated users
  const supabase = createServiceClient();

  const { data: link } = await supabase
    .from("document_links")
    .select("id, document_id, expires_at")
    .eq("token", token)
    .is("deleted_at", null)
    .single();

  if (!link) notFound();
  if (new Date(link.expires_at) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Link Expired</h1>
          <p className="text-muted-foreground mt-2">
            This share link has expired.
          </p>
        </div>
      </div>
    );
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("id, file_name, file_url")
    .eq("id", link.document_id)
    .is("deleted_at", null)
    .single();

  if (!doc) notFound();

  // Redirect to serve API with token for unauthenticated access
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  redirect(`${baseUrl}/api/documents/serve?token=${token}`);
}
