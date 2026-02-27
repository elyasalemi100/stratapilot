import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { notFound } from "next/navigation";

export default async function OwnersPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();
  const { data: lots } = await supabase.from("lots").select("id").eq("oc_id", oc.id).is("deleted_at", null);
  const lotIds = lots?.map((l) => l.id) ?? [];

  const { data: lotPeople } = lotIds.length > 0
    ? await supabase
        .from("lot_people")
        .select(`
          id, role, ownership_share_percent, is_primary_contact, lot_id,
          person:people(full_name, email, phone, mailing_address)
        `)
        .in("lot_id", lotIds)
        .eq("role", "owner")
        .is("deleted_at", null)
    : { data: [] };

  const { data: lotDetails } = await supabase
    .from("lots")
    .select("id, lot_number, unit_address")
    .in("id", lotIds);
  const lotDetailMap = Object.fromEntries((lotDetails ?? []).map((l) => [l.id, l]));

  const filtered = lotPeople ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Owners & Occupants</h1>
        <p className="text-muted-foreground">
          {filtered.length} owner records
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Owners
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground">No owners. Complete the OC setup wizard.</p>
          ) : (
            <div className="space-y-4">
              {filtered.map((lp) => {
                const person = lp.person as { full_name?: string; email?: string; phone?: string };
                const lot = lp.lot_id ? lotDetailMap[lp.lot_id] : null;
                return (
                  <div key={lp.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">
                        {person?.full_name ?? "—"}
                        {lp.is_primary_contact && (
                          <span className="ml-2 text-xs text-primary">Primary</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Lot {lot?.lot_number ?? "—"} • {person?.email ?? "—"}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {lp.ownership_share_percent}% share
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
