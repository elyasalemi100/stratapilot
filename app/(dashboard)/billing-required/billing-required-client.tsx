"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createCheckoutSession } from "@/lib/actions/stripe-actions";

interface BillingRequiredClientProps {
  ocSlug: string;
}

export function BillingRequiredClient({ ocSlug }: BillingRequiredClientProps) {
  const [loading, setLoading] = useState(false);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const handleSubscribe = async (interval: "monthly" | "yearly") => {
    setLoading(true);
    try {
      await createCheckoutSession(
        "starter",
        interval,
        `${baseUrl}/billing-required?success=1`,
        `${baseUrl}/billing-required?canceled=1`
      );
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Link href={`/${ocSlug}/settings/billing`}>
        <Button className="w-full" disabled={loading}>
          Choose a plan & subscribe
        </Button>
      </Link>
      <p className="text-xs text-muted-foreground text-center">
        You will be redirected to the billing page to select a plan.
      </p>
    </div>
  );
}
