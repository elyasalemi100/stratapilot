import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Serves document files. Supports:
 * 1) Authenticated user with OC access (path in query)
 * 2) Share token (token in query) - uses service role to bypass RLS
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const token = searchParams.get("token");

  if (token) {
    // Share link flow - unauthenticated access
    const supabase = createServiceClient();
    const { data: link } = await supabase
      .from("document_links")
      .select("document_id, expires_at")
      .eq("token", token)
      .is("deleted_at", null)
      .single();

    if (!link || new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    const { data: doc } = await supabase
      .from("documents")
      .select("file_url")
      .eq("id", link.document_id)
      .is("deleted_at", null)
      .single();

    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const storedPath = doc.file_url;
    const { data: signed } = await supabase.storage
      .from("documents")
      .createSignedUrl(storedPath, 3600);
    if (signed?.signedUrl) return NextResponse.redirect(signed.signedUrl);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const ocId = path.split("/")[0];
  const { canAccessOc } = await import("@/lib/auth/permissions");
  const ok = await canAccessOc(ocId);
  if (!ok) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: signed } = await supabase.storage
    .from("documents")
    .createSignedUrl(path, 3600);

  if (!signed?.signedUrl) return NextResponse.json({ error: "File not found" }, { status: 404 });
  return NextResponse.redirect(signed.signedUrl);
}
