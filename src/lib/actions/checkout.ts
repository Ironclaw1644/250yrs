"use server";

import { db } from "@/lib/supabase/admin";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { getActiveProducts } from "@/lib/store-queries";
import { checkCoupon } from "@/lib/coupons";
import { rateLimited } from "@/lib/rate-limit";
import { shippingCentsFor } from "@/lib/store-config";
import { sizeLabel, unitPriceCents } from "@/lib/store-types";

export interface CheckoutLineInput {
  productId: string;
  variantId: string | null;
  sizeKey: string | null;
  quantity: number;
}

export interface CheckoutInput {
  lines: CheckoutLineInput[];
  customer: { name: string; email: string; phone?: string };
  shippingAddress: Record<string, string>;
  couponCode?: string;
  /** Honeypot — bots fill it, humans never see it. */
  company?: string;
}

export type CheckoutResult =
  | {
      ok: true;
      clientSecret: string;
      orderToken: string;
      totals: { subtotalCents: number; shippingCents: number; discountCents: number; totalCents: number };
    }
  | { ok: false; error: string };

/**
 * The bondandfifth checkout model adapted to Stripe: everything is re-priced
 * from the DATABASE (client prices are never trusted), the order is written
 * pending, and a PaymentIntent for the authoritative total is returned for
 * the Payment Element to confirm. The webhook flips it to paid.
 */
export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  if (!stripeConfigured) return { ok: false, error: "Checkout isn't live yet — check back soon." };
  if (input.company) return { ok: false, error: "Something went wrong." }; // honeypot
  if (await rateLimited("checkout", 8, 10))
    return { ok: false, error: "Too many attempts — give it a few minutes." };

  const name = input.customer.name?.trim();
  const email = input.customer.email?.trim().toLowerCase();
  if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { ok: false, error: "Enter your name and a valid email." };
  if (!input.lines?.length) return { ok: false, error: "Your cart is empty." };
  if (input.lines.length > 20) return { ok: false, error: "Too many items." };

  // ---- Re-price authoritatively from the DB ----
  const catalog = await getActiveProducts();
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const items: {
    product_id: string;
    product_name: string;
    product_sku: string;
    variant_id: string | null;
    variant_label: string | null;
    size: string | null;
    unit_price_cents: number;
    quantity: number;
    line_total_cents: number;
    image_url: string | null;
    free_shipping: boolean;
  }[] = [];

  for (const line of input.lines) {
    const product = byId.get(line.productId);
    if (!product || product.status !== "active")
      return { ok: false, error: "An item in your cart is no longer available." };
    const qty = Math.min(10, Math.max(1, Math.trunc(line.quantity)));

    // Size must exist on the product when the product defines sizes.
    if (product.sizes.length > 0) {
      const parts = (line.sizeKey ?? "").split("|").filter(Boolean);
      if (parts.length === 0) return { ok: false, error: `Choose a size for ${product.name}.` };
      const valid = new Set(product.sizes.map((s) => s.size));
      for (const part of parts) {
        if (!valid.has(part)) return { ok: false, error: `Invalid size for ${product.name}.` };
        const row = product.sizes.find((s) => s.size === part)!;
        if (row.inventory !== null && row.inventory < qty)
          return { ok: false, error: `${product.name} (${sizeLabel(part)}) is out of stock.` };
      }
    }

    const variant = line.variantId
      ? product.variants.find((v) => v.id === line.variantId) ?? null
      : null;
    if (line.variantId && !variant)
      return { ok: false, error: `Invalid option for ${product.name}.` };

    const unit = unitPriceCents(product, variant?.id ?? null);
    const sizeText = line.sizeKey
      ? line.sizeKey.split("|").map((p) => sizeLabel(p)).join(" · ")
      : null;
    items.push({
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku + (variant?.sku_suffix ?? ""),
      variant_id: variant?.id ?? null,
      variant_label: variant?.label ?? null,
      size: sizeText,
      unit_price_cents: unit,
      quantity: qty,
      line_total_cents: unit * qty,
      image_url: product.images.find((i) => i.is_primary)?.public_url ?? product.images[0]?.public_url ?? null,
      free_shipping: product.free_shipping,
    });
  }

  const subtotal = items.reduce((s, i) => s + i.line_total_cents, 0);
  const shipping = shippingCentsFor(
    items.map((i) => ({ lineTotalCents: i.line_total_cents, freeShipping: i.free_shipping })),
  );

  let discount = 0;
  let couponCode: string | null = null;
  if (input.couponCode?.trim()) {
    const check = await checkCoupon(input.couponCode.trim(), subtotal);
    if (!check.valid) return { ok: false, error: check.reason ?? "Invalid coupon." };
    discount = check.discountCents ?? 0;
    couponCode = check.coupon!.code;
  }

  const total = Math.max(0, subtotal + shipping - discount);
  if (total < 50) return { ok: false, error: "Order total is too small to process." };

  // ---- Write the pending order + items ----
  const svc = db();
  const { data: order, error: orderErr } = await svc
    .from("orders")
    .insert({
      customer_name: name,
      customer_email: email,
      customer_phone: input.customer.phone?.trim() || null,
      shipping_address: input.shippingAddress ?? null,
      subtotal_cents: subtotal,
      shipping_cents: shipping,
      discount_code: couponCode,
      discount_cents: discount,
      total_cents: total,
      status: "pending",
      payment_status: "pending",
    })
    .select("id, order_number, confirmation_token")
    .single();
  if (orderErr || !order) return { ok: false, error: "Could not start your order — try again." };

  const { error: itemsErr } = await svc.from("order_items").insert(
    items.map(({ free_shipping: _drop, ...item }) => ({ ...item, order_id: order.id })),
  );
  if (itemsErr) {
    await svc.from("orders").delete().eq("id", order.id);
    return { ok: false, error: "Could not save your order — try again." };
  }

  // ---- PaymentIntent for the authoritative total ----
  try {
    const intent = await stripe().paymentIntents.create({
      amount: total,
      currency: "usd",
      receipt_email: email,
      automatic_payment_methods: { enabled: true },
      metadata: {
        site: "trueamericanwear",
        order_id: order.id,
        order_number: order.order_number,
      },
    });
    await svc
      .from("orders")
      .update({ stripe_payment_intent_id: intent.id })
      .eq("id", order.id);
    return {
      ok: true,
      clientSecret: intent.client_secret!,
      orderToken: order.confirmation_token,
      totals: { subtotalCents: subtotal, shippingCents: shipping, discountCents: discount, totalCents: total },
    };
  } catch (e) {
    await svc.from("orders").delete().eq("id", order.id);
    console.error("[checkout] paymentIntent", (e as Error).message);
    return { ok: false, error: "Payment setup failed — try again in a moment." };
  }
}

/** Live coupon validation for the checkout form. */
export async function validateCoupon(
  code: string,
  subtotalCents: number,
): Promise<{ valid: boolean; discountCents?: number; reason?: string }> {
  if (await rateLimited("coupon", 15, 10)) return { valid: false, reason: "Too many attempts." };
  const res = await checkCoupon(code, subtotalCents);
  return { valid: res.valid, discountCents: res.discountCents, reason: res.reason };
}
