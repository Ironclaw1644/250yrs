import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, stripeConfigured, PRICES, PLAN_LABEL } from "@/lib/stripe";
import { db } from "@/lib/supabase";
import { notify } from "@/lib/notify";

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

  // Transition detection: only status *changes* should notify the owner,
  // otherwise Stripe's retries and renewal events would spam them.
  const { data: prior } = await svc
    .from("subscriptions")
    .select("status")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();
  const wasActive = prior?.status === "active" || prior?.status === "trialing";

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

  const changedToActive = active && !wasActive;
  const changedToLapsed = wasActive && (sub.status === "canceled" || sub.status === "unpaid");
  if (changedToActive || changedToLapsed) {
    const { data: biz } = await svc
      .from("businesses")
      .select("owner_id, name")
      .eq("id", businessId)
      .maybeSingle();
    if (biz?.owner_id) {
      void notify({
        userId: biz.owner_id,
        type: "subscription",
        title: changedToActive
          ? `Advertising is active for ${biz.name}`
          : `Your advertising plan for ${biz.name} ended`,
        body: changedToActive ? PLAN_LABEL[plan] : "Restart anytime to get back in front of customers.",
        href: "/dashboard",
        email: {
          subject: changedToActive
            ? `You're advertising on True American Where`
            : `Your advertising plan ended`,
          bodyHtml: changedToActive
            ? `<p>Your plan (<strong>${PLAN_LABEL[plan]}</strong>) is active and <strong>${biz.name}</strong> is being shown to local customers. Add photos and a TV spot to make it shine.</p>`
            : `<p>The advertising plan for <strong>${biz.name}</strong> has ended, so the listing is no longer promoted. Restart anytime — your page, photos, and reviews are all saved.</p>`,
          ctaLabel: changedToActive ? "Open your dashboard" : "Restart advertising",
          ctaHref: "/dashboard",
        },
      });
    }
  }
}

/**
 * One-time credit-pack purchase → addon_purchases + payments + credit ledger.
 * Idempotent: the ledger's unique stripe_session_id index is the hard guard,
 * so Stripe retries and duplicate deliveries can never double-grant.
 */
async function grantVideoCredits(session: Stripe.Checkout.Session) {
  const businessId = session.metadata?.business_id;
  const credits = Number(session.metadata?.credits ?? 0);
  const pack = session.metadata?.pack ?? "starter";
  if (!businessId || credits <= 0) return;
  const svc = db();

  const { data: seen } = await svc
    .from("video_credits")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (seen) return; // already granted

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const { data: addon } = await svc
    .from("addon_purchases")
    .insert({
      business_id: businessId,
      addon_type: "video_ad",
      status: "succeeded",
      amount_cents: session.amount_total ?? 0,
      stripe_payment_intent_id: paymentIntentId,
      metadata: { pack, credits },
    })
    .select("id")
    .maybeSingle();

  if (addon?.id) {
    await svc.from("payments").insert({
      kind: "addon",
      business_id: businessId,
      addon_purchase_id: addon.id,
      amount_cents: session.amount_total ?? 0,
      status: "succeeded",
      stripe_payment_intent_id: paymentIntentId,
    });
  }

  const { error: ledgerError } = await svc.from("video_credits").insert({
    business_id: businessId,
    delta: credits,
    reason: `pack:${pack}`,
    addon_purchase_id: addon?.id ?? null,
    stripe_session_id: session.id,
  });
  // Unique violation = a concurrent delivery already granted; treat as success.
  if (ledgerError && ledgerError.code !== "23505") {
    throw new Error(`credit grant failed: ${ledgerError.message}`);
  }
  if (ledgerError) return;

  const { data: biz } = await svc
    .from("businesses")
    .select("owner_id, name")
    .eq("id", businessId)
    .maybeSingle();
  if (biz?.owner_id) {
    void notify({
      userId: biz.owner_id,
      type: "credits",
      title: `${credits} TV-spot credit${credits === 1 ? "" : "s"} added`,
      body: `Ready to use on ${biz.name}.`,
      href: `/dashboard/${businessId}/videos`,
      email: {
        subject: "Your TV-spot credits are ready",
        bodyHtml: `<p>Your <strong>${pack}</strong> pack is paid and <strong>${credits} credit${credits === 1 ? "" : "s"}</strong> ${credits === 1 ? "is" : "are"} in your wallet. Create a spot for <strong>${biz.name}</strong> whenever you're ready.</p>`,
        ctaLabel: "Open the studio",
        ctaHref: `/dashboard/${businessId}/videos`,
      },
    });
  }
}

export async function POST(req: Request) {
  if (!stripeConfigured) {
    return NextResponse.json({ received: false, reason: "stripe not configured" });
  }
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  // In production a verified signature is mandatory — an unverified payload
  // could grant credits or publish listings. The parse-without-verify path
  // exists only for local development against `stripe listen`-less setups.
  if (process.env.NODE_ENV === "production" && (!secret || !sig)) {
    return NextResponse.json(
      { error: "Webhook signature required" },
      { status: 400 },
    );
  }

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
        if (session.mode === "payment" && session.metadata?.kind === "video_credits") {
          await grantVideoCredits(session);
          break;
        }
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
