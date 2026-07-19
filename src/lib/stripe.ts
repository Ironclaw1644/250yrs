import "server-only";
import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;

/** True when server + client keys are both present. */
export const stripeConfigured = Boolean(
  secret && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
);

let _stripe: Stripe | null = null;

export function stripe(): Stripe {
  if (!secret) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing)");
  if (!_stripe) {
    _stripe = new Stripe(secret, { appInfo: { name: "True American Wear" } });
  }
  return _stripe;
}
