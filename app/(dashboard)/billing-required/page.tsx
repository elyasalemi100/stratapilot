import { getFirstOcSlugForBilling } from "@/lib/auth/subscription";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { BillingRequiredClient } from "./billing-required-client";

export default async function BillingRequiredPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>Please sign in to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button>Sign in</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const firstOcSlug = await getFirstOcSlugForBilling();
  const { data: profile } = await supabase
    .from("users_profile")
    .select("management_company_id")
    .eq("id", user.id)
    .single();

  const hasCompany = !!profile?.management_company_id;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Subscription required</CardTitle>
          </div>
          <CardDescription>
            StrataPilot requires an active subscription to access the dashboard.
            Subscribe to a plan to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasCompany ? (
            <p className="text-sm text-muted-foreground">
              Your account is not yet linked to a management company. Please
              contact your administrator to get access, or sign up for a new
              organization.
            </p>
          ) : firstOcSlug ? (
            <BillingRequiredClient ocSlug={firstOcSlug} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No Owners Corporations found. Contact your administrator to set up
              your account.
            </p>
          )}
          <Link href="/pricing" className="block text-sm text-primary hover:underline">
            View pricing plans →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
