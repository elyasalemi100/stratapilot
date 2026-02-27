import { notFound } from "next/navigation";
import { getOcBySlug, getOcsForUser, getDashboardBadges } from "@/lib/actions/oc-actions";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

export default async function OcLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const [oc, ocs, superAdmin] = await Promise.all([
    getOcBySlug(ocSlug),
    getOcsForUser(),
    isSuperAdmin(),
  ]);

  if (!oc) notFound();

  const badges = await getDashboardBadges(oc.id);

  const currentOc = {
    id: oc.id,
    slug: oc.slug,
    name: oc.name,
    plan_number: oc.plan_number,
  };

  const ocList = ocs.map((o) => ({
    id: o.id,
    slug: o.slug,
    name: o.name,
    plan_number: o.plan_number,
  }));

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        ocSlug={ocSlug}
        ocName={oc.name}
        isSuperAdmin={superAdmin}
        badges={{
          arrearsCount: badges.arrearsCount,
          unreconciledCount: badges.unreconciledCount,
          draftLevyRuns: badges.draftLevyRuns,
        }}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar currentOc={currentOc} ocs={ocList} />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-6">{children}</main>
      </div>
    </div>
  );
}
