import { getOcBySlug } from "@/lib/actions/oc-actions";
import { createClient } from "@/lib/supabase/server";
import { LevyRunWizard } from "@/components/wizards/levy-run-wizard";
import { notFound } from "next/navigation";

export default async function NewLevyRunPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const supabase = await createClient();
  const { data: funds } = await supabase
    .from("funds")
    .select("id, name, fund_type")
    .eq("oc_id", oc.id)
    .is("deleted_at", null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">New Levy Run</h1>
        <p className="text-muted-foreground">
          Create a new levy run for {oc.name}
        </p>
      </div>
      <LevyRunWizard ocId={oc.id} ocSlug={ocSlug} funds={funds ?? []} />
    </div>
  );
}
