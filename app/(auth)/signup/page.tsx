import { getSignupStatus } from "@/lib/actions/signup-actions";
import { SignupForm } from "./signup-form";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SignupPage() {
  const { blocked } = await getSignupStatus();

  if (blocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary">
              S
            </div>
            <CardTitle className="text-2xl font-bold">StrataPilot</CardTitle>
            <CardDescription>Signups are currently disabled</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              New account creation is temporarily disabled. Please contact your
              administrator for access.
            </p>
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-muted-foreground w-full">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <SignupForm />;
}
