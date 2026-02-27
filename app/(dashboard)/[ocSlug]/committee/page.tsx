import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Vote } from "lucide-react";
import { notFound } from "next/navigation";

export default async function CommitteePage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();
  const { data: terms } = await supabase
    .from("committee_terms")
    .select("id, term_start, term_end")
    .eq("oc_id", oc.id)
    .is("deleted_at", null)
    .order("term_start", { ascending: false })
    .limit(1);

  const currentTerm = terms?.[0];
  const { data: members } = currentTerm
    ? await supabase
        .from("committee_members")
        .select(`
          id, position,
          person:people(full_name, email),
          lot:lots(lot_number)
        `)
        .eq("committee_term_id", currentTerm.id)
        .is("deleted_at", null)
    : { data: [] };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Committee</h1>
        <p className="text-muted-foreground">
          {currentTerm
            ? `Term: ${formatDate(currentTerm.term_start)} - ${formatDate(currentTerm.term_end)}`
            : "No committee term"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Committee Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(members ?? []).length === 0 ? (
            <p className="text-muted-foreground">No committee members. Complete the OC setup wizard.</p>
          ) : (
            <div className="space-y-4">
              {(members ?? []).map((m) => {
                const person = m.person as { full_name?: string; email?: string };
                const lot = m.lot as { lot_number?: string };
                return (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{person?.full_name ?? "—"}</p>
                      <p className="text-sm text-muted-foreground">
                        Lot {lot?.lot_number ?? "—"} • {person?.email ?? "—"}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-sm font-medium capitalize">
                      {m.position}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
