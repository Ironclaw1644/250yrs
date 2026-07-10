import "server-only";
import Stripe from "stripe";
import type { CreditPack } from "./video-plans";

const secret = process.env.STRIPE_SECRET_KEY;

/** True only when both the secret and publishable keys are present. */
export const stripeConfigured = Boolean(
  secret && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
);

let _stripe: Stripe | null = null;

export function stripe(): Stripe {
  if (!secret) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing)");
  if (!_stripe) {
    _stripe = new Stripe(secret, { appInfo: { name: "True American Where" } });
  }
  return _stripe;
}

/** Advertising subscription price ids (created by scripts/stripe-seed-prices.ts). */
export const PRICES: Record<"monthly" | "annual", string | undefined> = {
  monthly: process.env.STRIPE_PRICE_ADVERTISING_MONTHLY,
  annual: process.env.STRIPE_PRICE_ADVERTISING_ANNUAL,
};

export const PLAN_LABEL: Record<"monthly" | "annual", string> = {
  monthly: "$19.99 / month",
  annual: "$100 / year",
};

/** TV-spot credit-pack price ids (created by scripts/stripe-seed-prices.ts). */
export const CREDIT_PACK_PRICES: Record<CreditPack, string | undefined> = {
  starter: process.env.STRIPE_PRICE_VIDEO_STARTER,
  pro: process.env.STRIPE_PRICE_VIDEO_PRO,
  studio: process.env.STRIPE_PRICE_VIDEO_STUDIO,
};
