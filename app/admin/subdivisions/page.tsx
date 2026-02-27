import { getAllSubdivisions } from "@/lib/actions/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Home } from "lucide-react";

export default async function AdminSubdivisionsPage() {
  const subdivisions = await getAllSubdivisions();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Subdivisions</h1>
        <p className="text-muted-foreground">
          All OC subdivisions across the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            All Subdivisions ({subdivisions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Plan Number</th>
                  <th className="text-left py-3">OC</th>
                  <th className="text-left py-3">Common Property Notes</th>
                  <th className="text-left py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {subdivisions.map((s) => {
                  const oc = s.oc as { id?: string; name?: string; plan_number?: string } | { id?: string; name?: string; plan_number?: string }[];
                  const ocData = Array.isArray(oc) ? oc[0] : oc;
                  return (
                    <tr key={s.id} className="border-b">
                      <td className="py-3 font-medium">{s.plan_number}</td>
                      <td className="py-3">
                        {ocData?.name ?? "—"} ({ocData?.plan_number ?? "—"})
                      </td>
                      <td className="py-3 text-muted-foreground max-w-xs truncate">
                        {s.common_property_notes ?? "—"}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {formatDateTime(s.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
