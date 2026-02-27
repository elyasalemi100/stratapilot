import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOcsForUser } from "@/lib/actions/oc-actions";
import Link from "next/link";

export default async function HomePage() {
  let user;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold">StrataPilot</h1>
        <p className="text-center text-muted-foreground">
          Unable to connect. Check Supabase URL and keys in Vercel environment variables.
        </p>
        <Link href="/login" className="text-primary hover:underline">
          Try login page
        </Link>
      </div>
    );
  }

  if (!user) {
    redirect("/login");
  }

  const ocs = await getOcsForUser();
  if (ocs.length === 0) {
    redirect("/portfolio");
  }

  redirect(`/${ocs[0].slug}/dashboard`);
}
