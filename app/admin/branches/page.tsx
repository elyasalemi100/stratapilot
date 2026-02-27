import {
  getBranches,
  getBranchOcCount,
  getBranchUserCount,
  updateBranchStatus,
} from "@/lib/actions/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Building2 } from "lucide-react";
import { BranchActions } from "./branch-actions";

export default async function AdminBranchesPage() {
  const branches = await getBranches();
  const counts = await Promise.all(
    branches.map(async (b) => ({
      id: b.id,
      ocCount: await getBranchOcCount(b.id),
      userCount: await getBranchUserCount(b.id),
    }))
  );
  const countMap = Object.fromEntries(counts.map((c) => [c.id, c]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Branches</h1>
        <p className="text-muted-foreground">
          Management companies (branches) on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Branches ({branches.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Name</th>
                  <th className="text-left py-3">ABN</th>
                  <th className="text-left py-3">OCs</th>
                  <th className="text-left py-3">Users</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Enterprise</th>
                  <th className="text-left py-3">Created</th>
                  <th className="text-right py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => {
                  const c = countMap[b.id];
                  return (
                    <tr key={b.id} className="border-b">
                      <td className="py-3 font-medium">{b.name}</td>
                      <td className="py-3">{b.abn ?? "—"}</td>
                      <td className="py-3">{c?.ocCount ?? 0}</td>
                      <td className="py-3">{c?.userCount ?? 0}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            b.status === "banned" ? "bg-destructive/10 text-destructive" :
                            b.status === "suspended" ? "bg-amber-500/10 text-amber-700" :
                            "bg-green-500/10 text-green-700"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3">{b.is_enterprise ? "Yes" : "—"}</td>
                      <td className="py-3 text-muted-foreground">
                        {formatDateTime(b.created_at)}
                      </td>
                      <td className="py-3 text-right">
                        <BranchActions
                          branchId={b.id}
                          currentStatus={b.status as "active" | "suspended" | "banned"}
                        />
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
