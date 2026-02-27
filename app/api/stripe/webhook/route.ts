import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session & {
          metadata?: { management_company_id?: string };
        };
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const companyId = session.metadata?.management_company_id;

        if (companyId && customerId) {
          await supabase
            .from("management_companies")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId ?? undefined,
              updated_at: new Date().toISOString(),
            })
            .eq("id", companyId);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription & {
          metadata?: { management_company_id?: string };
        };
        const companyId = subscription.metadata?.management_company_id;

        if (companyId) {
          const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };
          if (event.type === "customer.subscription.deleted" || subscription.status === "canceled") {
            updates.stripe_subscription_id = null;
          } else {
            updates.stripe_subscription_id = subscription.id;
          }
          await supabase
            .from("management_companies")
            .update(updates)
            .eq("id", companyId);
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
