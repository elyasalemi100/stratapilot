import { getOcBySlug } from "@/lib/actions/oc-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Receipt, Landmark, Calendar, Mail } from "lucide-react";
import { notFound } from "next/navigation";

export default async function QuickActionsPage({
  params,
}: {
  params: Promise<{ ocSlug: string }>;
}) {
  const { ocSlug } = await params;
  const oc = await getOcBySlug(ocSlug);
  if (!oc) notFound();

  const actions = [
    { title: "New levy run", href: `/${ocSlug}/levies/runs/new`, icon: Receipt },
    { title: "Import bank CSV", href: `/${ocSlug}/banking/import`, icon: Landmark },
    { title: "Schedule meeting", href: `/${ocSlug}/meetings/new`, icon: Calendar },
    { title: "Send arrears reminder", href: `/${ocSlug}/levies/arrears`, icon: Mail },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Quick Actions</h1>
        <p className="text-muted-foreground">
          Common tasks for {oc.name}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardHeader>
                <a.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">{a.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm">
                  Go
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
