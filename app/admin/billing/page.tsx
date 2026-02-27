import { getBranches } from "@/lib/actions/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ExternalLink } from "lucide-react";

export default async function AdminBillingPage() {
  const branches = await getBranches();
  const withStripe = branches.filter((b) => b.stripe_customer_id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Stripe Billing</h1>
        <p className="text-muted-foreground">
          View billing and subscription status. Integrate with Stripe Dashboard for full management.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground mb-4">
              {withStripe.length} of {branches.length} branches have Stripe customer IDs.
              Connect Stripe to enable subscription management.
            </p>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Open Stripe Dashboard
              <ExternalLink className="h-4 w-4" />
            </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branches with Stripe</CardTitle>
        </CardHeader>
        <CardContent>
          {withStripe.length === 0 ? (
            <p className="text-muted-foreground">
              No branches connected to Stripe yet. Add stripe_customer_id when integrating.
            </p>
          ) : (
            <div className="space-y-2">
              {withStripe.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {b.stripe_customer_id}
                    </p>
                  </div>
                  <a
                    href={`https://dashboard.stripe.com/customers/${b.stripe_customer_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View in Stripe
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enterprise Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Enterprise plans can be managed per branch. Set is_enterprise and enterprise_plan on
            management_companies. Enterprise users are flagged in the Users table.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
