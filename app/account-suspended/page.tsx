import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default async function AccountSuspendedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users_profile")
    .select("status, suspended_reason, banned_reason")
    .eq("id", user.id)
    .single();

  if (profile?.status === "active") redirect("/");

  const reason =
    profile?.status === "banned"
      ? profile?.banned_reason
      : profile?.suspended_reason;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-6 w-6" />
            Account {profile?.status === "banned" ? "Banned" : "Suspended"}
          </CardTitle>
          <CardContent className="pt-4">
            <p className="text-muted-foreground">
              Your account has been {profile?.status === "banned" ? "banned" : "suspended"}.
              {reason && (
                <span className="block mt-2 text-sm">
                  Reason: {reason}
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Please contact support if you believe this is an error.
            </p>
            <form action="/auth/signout" method="post" className="mt-6">
              <button
                type="submit"
                className="text-sm text-primary hover:underline"
              >
                Sign out
              </button>
            </form>
          </CardContent>
        </CardHeader>
      </Card>
    </div>
  );
}
