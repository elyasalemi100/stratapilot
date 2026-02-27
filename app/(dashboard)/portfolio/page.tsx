import { getOcsForUser } from "@/lib/actions/oc-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export default async function PortfolioPage() {
  const ocs = await getOcsForUser();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground">All Owners Corporations</p>
      </div>

      {ocs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No OCs yet</CardTitle>
            <CardContent className="pt-4">
              <p className="text-muted-foreground mb-4">
                Create your first Owners Corporation to get started.
              </p>
              <Link href="/portfolio/new">
                <Button>Add OC</Button>
              </Link>
            </CardContent>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="flex justify-end">
            <Link href="/portfolio/new">
              <Button>Add OC</Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ocs.map((oc) => (
            <Link key={oc.id} href={`/${oc.slug}/dashboard`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-2">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{oc.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{oc.plan_number}</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
          </div>
        </>
      )}
    </div>
  );
}
