import { getOcBySlug } from "@/lib/actions/oc-actions";
import { OcSetupWizard } from "@/components/wizards/oc-setup-wizard";
import { notFound } from "next/navigation";

export default async function SetupPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);

  if (!oc) notFound();

  return (
    <div className="container max-w-4xl py-8">
      <OcSetupWizard />
    </div>
  );
}
