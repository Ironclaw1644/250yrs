import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, stripeConfigured, PRICES } from "@/lib/stripe";
import { db } from "@/lib/supabase";

// Stripe needs the raw body for signature verification.
export const runtime = "nodejs";

function planFromPrice(priceId: string | undefined, fallback?: string): "monthly" | "annual" {
  if (priceId && priceId === PRICES.annual) return "annual";
  if (priceId && priceId === PRICES.monthly) return "monthly";
  return fallback === "annual" ? "annual" : "monthly";
}

async function upsertFromSubscription(sub: Stripe.Subscription) {
  const businessId = sub.metadata?.business_id;
  if (!businessId) return;
  const svc = db();
  // In the current Stripe API the billing period lives on the subscription item.
  const item = sub.items?.data?.[0] as unknown as
    | { current_period_start?: number; current_period_end?: number; price?: { id?: string } }
    | undefined;
  const priceId = item?.price?.id;
  const plan = planFromPrice(priceId, sub.metadata?.plan);
  const active = sub.status === "active" || sub.status === "trialing";

  await svc
    .from("subscriptions")
    .upsert(
      {
        business_id: businessId,
        plan_tier: plan,
        status: sub.status,
        stripe_customer_id:
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        current_period_start: item?.current_period_start
          ? new Date(item.current_period_start * 1000).toISOString()
          : null,
        current_period_end: item?.current_period_end
          ? new Date(item.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
      },
      { onConflict: "stripe_subscription_id" },
    );

  if (active) {
    // Entitlement: paid ⇒ publish + set the plan tier (webhook is the source of truth).
    await svc
      .from("businesses")
      .update({ plan_tier: plan, status: "published", published_at: new Date().toISOString() })
      .eq("id", businessId)
      .neq("status", "suspended"); // never un-suspend an admin takedown
  } else if (sub.status === "canceled" || sub.status === "unpaid") {
    await svc.from("businesses").update({ plan_tier: "free" }).eq("id", businessId);
  }
}

export async function POST(req: Request) {
  if (!stripeConfigured) {
    return NextResponse.json({ received: false, reason: "stripe not configured" });
  }
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    event =
      secret && sig
        ? stripe().webhooks.constructEvent(body, sig, secret)
        : (JSON.parse(body) as Stripe.Event);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (subId) {
          const sub = await stripe().subscriptions.retrieve(subId);
          // carry checkout metadata onto the subscription if missing
          if (!sub.metadata?.business_id && session.metadata?.business_id) {
            sub.metadata = { ...sub.metadata, ...session.metadata };
          }
          await upsertFromSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertFromSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
