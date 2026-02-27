import { redirect } from "next/navigation";
import { getOcsForUser } from "@/lib/actions/oc-actions";

export default async function HomePage() {
  const ocs = await getOcsForUser();

  if (ocs.length === 0) {
    redirect("/portfolio");
  }

  redirect(`/${ocs[0].slug}/dashboard`);
}
