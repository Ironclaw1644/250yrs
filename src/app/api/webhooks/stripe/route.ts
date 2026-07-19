import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { db } from "@/lib/supabase/admin";
import { sendOrderEmails } from "@/lib/email";
import type { OrderWithItems } from "@/lib/store-types";

// Stripe needs the raw body for signature verification.
export const runtime = "nodejs";

/**
 * Marks the order paid exactly once (guarded by the pending→paid transition),
 * decrements inventory, redeems the coupon, and sends the confirmation emails.
 * Idempotent under Stripe retries.
 */
async function handlePaymentSucceeded(intent: Stripe.PaymentIntent) {
  if (intent.metadata?.site !== "trueamericanwear") return;
  const orderId = intent.metadata?.order_id;
  if (!orderId) return;
  const svc = db();

  // Transition guard: only one delivery flips pending → paid.
  const { data: updated } = await svc
    .from("orders")
    .update({ payment_status: "paid", status: "confirmed" })
    .eq("id", orderId)
    .eq("payment_status", "pending")
    .select("id")
    .maybeSingle();
  if (!updated) return; // already processed (retry) or unknown order

  const { data: order } = await svc.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return;
  const { data: items } = await svc.from("order_items").select("*").eq("order_id", orderId);
  const full = { ...order, items: items ?? [] } as OrderWithItems;

  // Best-effort inventory decrement (per-size first, product-level fallback).
  for (const item of full.items) {
    if (!item.product_id) continue;
    try {
      if (item.size) {
        // item.size holds display labels; decrement every matching size row
        const { data: sizes } = await svc
          .from("product_sizes")
          .select("id, size, inventory")
          .eq("product_id", item.product_id);
        for (const s of sizes ?? []) {
          if (s.inventory === null) continue;
          // match stored size against the display label parts
          const label = item.size.toLowerCase();
          const bare = s.size.includes(":") ? s.size.split(":")[1] : s.size;
          const display = bare.startsWith("us_")
            ? `us ${bare.slice(3).replace("_", ".")}`
            : bare.toLowerCase();
          if (label.includes(display)) {
            await svc
              .from("product_sizes")
              .update({ inventory: Math.max(0, s.inventory - item.quantity) })
              .eq("id", s.id);
          }
        }
      }
      const { data: prod } = await svc
        .from("products")
        .select("inventory")
        .eq("id", item.product_id)
        .maybeSingle();
      if (prod?.inventory !== null && prod?.inventory !== undefined) {
        await svc
          .from("products")
          .update({ inventory: Math.max(0, prod.inventory - item.quantity) })
          .eq("id", item.product_id);
      }
    } catch (e) {
      console.error("[webhook] inventory", (e as Error).message);
    }
  }

  // Coupon redemption count.
  if (full.discount_code) {
    try {
      const { data: coupon } = await svc
        .from("coupons")
        .select("id, times_redeemed")
        .ilike("code", full.discount_code)
        .maybeSingle();
      if (coupon) {
        await svc
          .from("coupons")
          .update({ times_redeemed: coupon.times_redeemed + 1 })
          .eq("id", coupon.id);
      }
    } catch (e) {
      console.error("[webhook] coupon", (e as Error).message);
    }
  }

  await sendOrderEmails(full).catch((e) => console.error("[webhook] emails", e.message));
}

async function handlePaymentFailed(intent: Stripe.PaymentIntent) {
  if (intent.metadata?.site !== "trueamericanwear") return;
  const orderId = intent.metadata?.order_id;
  if (!orderId) return;
  await db()
    .from("orders")
    .update({ payment_status: "failed" })
    .eq("id", orderId)
    .eq("payment_status", "pending");
}

export async function POST(req: Request) {
  if (!stripeConfigured) {
    return NextResponse.json({ received: false, reason: "stripe not configured" });
  }
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  // Production requires a verified signature — an unverified payload could
  // mark orders paid for free.
  if (process.env.NODE_ENV === "production" && (!secret || !sig)) {
    return NextResponse.json({ error: "Webhook signature required" }, { status: 400 });
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
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        break;
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
