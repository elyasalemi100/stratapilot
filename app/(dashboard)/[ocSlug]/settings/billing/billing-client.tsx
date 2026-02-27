"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession, createBillingPortalSession } from "@/lib/actions/stripe-actions";

interface BillingClientProps {
  ocSlug: string;
  hasSubscription: boolean;
  planId?: string;
}

export function BillingClient({
  ocSlug,
  hasSubscription,
  planId,
}: BillingClientProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const handleSubscribe = async (interval: "monthly" | "yearly") => {
    if (!planId) return;
    setLoading(`subscribe-${interval}`);
    try {
      await createCheckoutSession(
        planId,
        interval,
        `${baseUrl}/${ocSlug}/settings/billing?success=1`,
        `${baseUrl}/${ocSlug}/settings/billing?canceled=1`
      );
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setLoading("portal");
    try {
      await createBillingPortalSession(
        `${baseUrl}/${ocSlug}/settings/billing`
      );
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to open billing portal");
    } finally {
      setLoading(null);
    }
  };

  if (hasSubscription) {
    return (
      <Button
        onClick={handleManageBilling}
        disabled={!!loading}
        variant="outline"
      >
        {loading === "portal" ? "Opening..." : "Manage subscription"}
      </Button>
    );
  }

  if (planId) {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => handleSubscribe("monthly")}
          disabled={!!loading}
        >
          {loading === "subscribe-monthly" ? "..." : "Subscribe monthly"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSubscribe("yearly")}
          disabled={!!loading}
        >
          {loading === "subscribe-yearly" ? "..." : "Subscribe yearly"}
        </Button>
      </div>
    );
  }

  return null;
}
