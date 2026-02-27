/**
 * Stripe pricing configuration for StrataPilot.
 * Create products and prices in Stripe Dashboard, then set env vars.
 */

export const STRIPE_CURRENCY = "aud" as const;

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  features: string[];
  maxOcs: number;
  maxUsers: number;
  highlighted?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small strata managers",
    priceMonthly: 49,
    priceYearly: 470,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
    features: [
      "Up to 5 OCs",
      "Up to 10 users",
      "Levy generation & invoicing",
      "Bank reconciliation",
      "Meeting packs & minutes",
      "Email support",
    ],
    maxOcs: 5,
    maxUsers: 10,
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing strata businesses",
    priceMonthly: 149,
    priceYearly: 1430,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY,
    features: [
      "Up to 25 OCs",
      "Up to 50 users",
      "Everything in Starter",
      "Advanced reports",
      "API access",
      "Priority support",
    ],
    maxOcs: 25,
    maxUsers: 50,
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large operations",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "Unlimited OCs",
      "Unlimited users",
      "Everything in Professional",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
    maxOcs: -1,
    maxUsers: -1,
  },
];

export function getPlanById(id: string): PricingPlan | undefined {
  return PRICING_PLANS.find((p) => p.id === id);
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
