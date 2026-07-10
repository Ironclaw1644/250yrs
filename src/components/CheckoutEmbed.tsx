"use client";

import { useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { createSubscriptionCheckout, createCreditCheckout } from "@/lib/actions/billing";
import type { CreditPack } from "@/lib/video-plans";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

export function CheckoutEmbed({
  businessId,
  plan,
  pack,
}: {
  businessId: string;
  plan?: "monthly" | "annual";
  pack?: CreditPack;
}) {
  const fetchClientSecret = useCallback(async () => {
    const res = pack
      ? await createCreditCheckout(businessId, pack)
      : await createSubscriptionCheckout(businessId, plan ?? "monthly");
    if (!res.clientSecret) throw new Error(res.error || "Checkout unavailable");
    return res.clientSecret;
  }, [businessId, plan, pack]);

  if (!stripePromise) return null;

  return (
    <div className="overflow-hidden rounded-xl bg-paper-raised">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
