import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOcsForUser } from "@/lib/actions/oc-actions";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const ocs = await getOcsForUser();
  if (ocs.length === 0) {
    redirect("/portfolio");
  }

  redirect(`/${ocs[0].slug}/dashboard`);
}
