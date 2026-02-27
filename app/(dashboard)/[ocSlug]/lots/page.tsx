import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

export default async function LotsPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();
  const { data: lots } = await supabase
    .from("lots")
    .select("id, lot_number, unit_address, entitlements, liabilities")
    .eq("oc_id", oc.id)
    .is("deleted_at", null)
    .order("lot_number");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Lots</h1>
        <p className="text-muted-foreground">{lots?.length ?? 0} lots</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lot Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {lots?.length === 0 ? (
            <p className="text-muted-foreground">No lots. Complete the OC setup wizard.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Lot</th>
                    <th className="text-left py-2">Address</th>
                    <th className="text-right py-2">Entitlements</th>
                    <th className="text-right py-2">Liabilities</th>
                  </tr>
                </thead>
                <tbody>
                  {lots?.map((l) => (
                    <tr key={l.id} className="border-b">
                      <td className="py-2">{l.lot_number}</td>
                      <td className="py-2">{l.unit_address ?? "—"}</td>
                      <td className="text-right py-2">{l.entitlements}</td>
                      <td className="text-right py-2">{l.liabilities}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
