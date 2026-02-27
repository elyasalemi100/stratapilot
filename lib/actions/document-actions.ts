"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function getDocuments(ocId: string, folder?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("documents")
    .select("id, file_name, folder, file_url, file_size, created_at, meeting_id")
    .eq("oc_id", ocId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (folder) {
    query = query.eq("folder", folder);
  }

  const { data } = await query;
  return data ?? [];
}

export async function createDocumentLink(
  documentId: string,
  expiresInDays: number = 7
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const { data, error } = await supabase
    .from("document_links")
    .insert({
      document_id: documentId,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return { ...data, fullUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/share/${token}` };
}

export async function getDocumentLinks(ocId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: docs } = await supabase
    .from("documents")
    .select("id")
    .eq("oc_id", ocId)
    .is("deleted_at", null);

  const docIds = docs?.map((d) => d.id) ?? [];
  if (docIds.length === 0) return [];

  const { data } = await supabase
    .from("document_links")
    .select(`
      id, token, expires_at, created_at,
      document:documents(id, file_name, folder)
    `)
    .in("document_id", docIds)
    .is("deleted_at", null);

  return data ?? [];
}

export async function revokeDocumentLink(linkId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("document_links")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", linkId);

  revalidatePath("/");
}
