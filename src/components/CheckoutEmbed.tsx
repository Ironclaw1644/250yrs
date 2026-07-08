"use client";

import { useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { createSubscriptionCheckout } from "@/lib/actions/billing";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

export function CheckoutEmbed({
  businessId,
  plan,
}: {
  businessId: string;
  plan: "monthly" | "annual";
}) {
  const fetchClientSecret = useCallback(async () => {
    const res = await createSubscriptionCheckout(businessId, plan);
    if (!res.clientSecret) throw new Error(res.error || "Checkout unavailable");
    return res.clientSecret;
  }, [businessId, plan]);

  if (!stripePromise) return null;

  return (
    <div className="overflow-hidden rounded-xl bg-paper-raised">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
