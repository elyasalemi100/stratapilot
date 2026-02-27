import { getOcBySlug } from "@/lib/actions/oc-actions";
import { NewMeetingForm } from "./new-meeting-form";
import { notFound } from "next/navigation";

export default async function NewMeetingPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">New Meeting</h1>
        <p className="text-muted-foreground">Create a new meeting for {oc.name}</p>
      </div>
      <NewMeetingForm ocId={oc.id} ocSlug={ocSlug} />
    </div>
  );
}
