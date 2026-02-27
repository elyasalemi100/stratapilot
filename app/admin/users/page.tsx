import { getAllUsers } from "@/lib/actions/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Users } from "lucide-react";
import { UserActions } from "./user-actions";
import { Input } from "@/components/ui/input";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  let users = await getAllUsers();
  if (q) {
    const lower = q.toLowerCase();
    users = users.filter(
      (u) =>
        u.email?.toLowerCase().includes(lower) ||
        u.full_name?.toLowerCase().includes(lower) ||
        (u.company as { name?: string })?.name?.toLowerCase().includes(lower)
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          All platform users. Ban, suspend, or reactivate.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({users.length})
          </CardTitle>
          <form className="pt-4" action="/admin/users" method="get">
            <Input
              name="q"
              placeholder="Search by email, name, or company..."
              defaultValue={q}
              className="max-w-md"
            />
          </form>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Email</th>
                  <th className="text-left py-3">Name</th>
                  <th className="text-left py-3">Company</th>
                  <th className="text-left py-3">Role</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Enterprise</th>
                  <th className="text-left py-3">Created</th>
                  <th className="text-right py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="py-3 font-medium">{u.email}</td>
                    <td className="py-3">{u.full_name ?? "—"}</td>
                    <td className="py-3">{(u.company as { name?: string })?.name ?? "—"}</td>
                    <td className="py-3">{u.role}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          u.status === "banned" ? "bg-destructive/10 text-destructive" :
                          u.status === "suspended" ? "bg-amber-500/10 text-amber-700" :
                          "bg-green-500/10 text-green-700"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3">{u.is_enterprise ? "Yes" : "—"}</td>
                    <td className="py-3 text-muted-foreground">
                      {formatDateTime(u.created_at)}
                    </td>
                    <td className="py-3 text-right">
                      <UserActions
                        userId={u.id}
                        currentStatus={u.status as "active" | "suspended" | "banned"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
