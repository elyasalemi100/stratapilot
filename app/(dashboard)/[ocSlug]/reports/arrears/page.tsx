import { redirect } from "next/navigation";

export default async function ArrearsReportPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  redirect(`/${ocSlug}/levies/arrears`);
}
