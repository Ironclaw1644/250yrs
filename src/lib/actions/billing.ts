"use server";

import { headers } from "next/headers";
import type Stripe from "stripe";
import { stripe, stripeConfigured, PRICES } from "@/lib/stripe";
import { requireUser, ownsBusiness } from "@/lib/auth";
import { db } from "@/lib/supabase";

export type CheckoutResult = {
  configured: boolean;
  clientSecret?: string;
  error?: string;
};

/**
 * Creates an EMBEDDED subscription Checkout Session (no redirect) and returns
 * its client_secret. Entitlement/publish is granted by the webhook, never here.
 */
export async function createSubscriptionCheckout(
  businessId: string,
  plan: "monthly" | "annual",
): Promise<CheckoutResult> {
  if (!stripeConfigured) return { configured: false };
  const price = PRICES[plan];
  if (!price) return { configured: false };

  const user = await requireUser();
  if (!(await ownsBusiness(businessId)))
    return { configured: true, error: "That business isn't in your account." };

  const svc = db();
  const { data: existing } = await svc
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("business_id", businessId)
    .maybeSingle();

  let customer = existing?.stripe_customer_id ?? undefined;
  if (!customer) {
    const created = await stripe().customers.create({
      email: user.email ?? undefined,
      metadata: { business_id: businessId, user_id: user.id },
    });
    customer = created.id;
  }

  const origin =
    (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const session = await stripe().checkout.sessions.create({
    ui_mode: "embedded",
    mode: "subscription",
    customer,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { business_id: businessId, plan } },
    return_url: `${origin}/dashboard/${businessId}/advertise?done=1&session_id={CHECKOUT_SESSION_ID}`,
    metadata: { business_id: businessId, plan },
  } as unknown as Stripe.Checkout.SessionCreateParams);

  return { configured: true, clientSecret: session.client_secret ?? undefined };
}
