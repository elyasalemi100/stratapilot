import {
  getPlatformSettings,
  getBranches,
  getAllUsers,
} from "@/lib/actions/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Home, CreditCard, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function AdminPage() {
  const [settings, companies, users] = await Promise.all([
    getPlatformSettings(),
    getBranches(),
    getAllUsers(),
  ]);

  const signupsBlocked = settings.signups_blocked === true || settings.signups_blocked === "true";
  const whitelistEnabled = settings.email_whitelist_enabled === true || settings.email_whitelist_enabled === "true";

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-6">
        <h1 className="text-3xl font-bold">Platform Admin</h1>
        <p className="mt-1 text-muted-foreground">
          Manage branches, users, billing, and platform settings
        </p>
      </div>

      {(signupsBlocked || whitelistEnabled) && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <AlertCircle className="h-5 w-5" />
              Signup Restrictions Active
            </CardTitle>
            <CardContent className="pt-0">
              <ul className="list-disc pl-4 space-y-1 text-sm">
                {signupsBlocked && <li>Signups are blocked</li>}
                {whitelistEnabled && <li>Email whitelist is enabled</li>}
              </ul>
              <Link href="/admin/settings" className="text-sm text-primary hover:underline mt-2 inline-block">
                Manage settings →
              </Link>
            </CardContent>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/branches">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Branches</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companies.length}</div>
              <p className="text-xs text-muted-foreground">Management companies</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/users">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">Total platform users</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/subdivisions">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subdivisions</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">View all subdivisions</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/billing">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Billing</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Stripe</div>
              <p className="text-xs text-muted-foreground">View billing & subscriptions</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/settings" className="block text-sm text-primary hover:underline">
              Toggle signup blocking
            </Link>
            <Link href="/admin/whitelist" className="block text-sm text-primary hover:underline">
              Manage email whitelist
            </Link>
            <Link href="/admin/coupons" className="block text-sm text-primary hover:underline">
              Create coupon code
            </Link>
            <Link href="/admin/branches" className="block text-sm text-primary hover:underline">
              Suspend / reactivate branch
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            {users.slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{u.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {(u.company as { name?: string })?.name ?? "—"} • {u.role}
                  </p>
                </div>
                <span
                  className={`text-xs rounded-full px-2 py-0.5 ${
                    u.status === "banned" ? "bg-destructive/10 text-destructive" :
                    u.status === "suspended" ? "bg-amber-500/10 text-amber-700" :
                    "bg-green-500/10 text-green-700"
                  }`}
                >
                  {u.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
