import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { notFound } from "next/navigation";

export default async function UsersSettingsPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("user_oc_assignments")
    .select(`
      id,
      user:users_profile(email, full_name, role)
    `)
    .eq("oc_id", oc.id);

  const users = (assignments ?? [])
    .map((a) => a.user as { email?: string; full_name?: string; role?: string } | null)
    .filter((u): u is { email?: string; full_name?: string; role?: string } => u != null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Users & Permissions</h1>
        <p className="text-muted-foreground">
          Users with access to this OC
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigned Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground">No users assigned. Contact your management company admin.</p>
          ) : (
            <div className="space-y-2">
              {users.map((u: { email?: string; full_name?: string; role?: string }, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{u.full_name ?? u.email}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
