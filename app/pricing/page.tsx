import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { PRICING_PLANS, formatPrice } from "@/lib/stripe/config";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">StrataPilot Pricing</h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, transparent pricing for Australian strata managers. Start free, scale as you grow.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={
                plan.highlighted
                  ? "border-primary shadow-lg ring-2 ring-primary/20"
                  : ""
              }
            >
              <CardHeader>
                {plan.highlighted && (
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Most popular
                  </span>
                )}
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-4">
                  {plan.id === "enterprise" ? (
                    <p className="text-2xl font-bold">Contact us</p>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">
                        {formatPrice(plan.priceMonthly)}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        or {formatPrice(plan.priceYearly)}/year (save 20%)
                      </p>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.id === "enterprise" ? (
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      Contact sales
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button
                      className="w-full"
                      variant={plan.highlighted ? "default" : "outline"}
                    >
                      Get started
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          All prices in AUD. GST may apply. Cancel anytime.
        </p>

        <div className="mt-12 text-center">
          <Link href="/" className="text-primary hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
