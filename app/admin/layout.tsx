import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Shield } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users_profile")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "platform_super_admin") {
    redirect("/");
  }

  if (profile?.status === "suspended" || profile?.status === "banned") {
    redirect("/account-suspended");
  }

  const navItems = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/branches", label: "Branches" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/subdivisions", label: "Subdivisions" },
    { href: "/admin/coupons", label: "Coupon Codes" },
    { href: "/admin/whitelist", label: "Email Whitelist" },
    { href: "/admin/settings", label: "Platform Settings" },
    { href: "/admin/billing", label: "Stripe Billing" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="flex h-14 items-center gap-6 px-6">
          <Link href="/admin" className="flex items-center gap-2 font-semibold text-primary">
            <Shield className="h-5 w-5" />
            Platform Admin
          </Link>
          <nav className="flex gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="ml-auto text-sm text-muted-foreground hover:text-foreground">
            ← Back to App
          </Link>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
