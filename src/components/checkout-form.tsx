"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useCart } from "./cart/cart-provider";
import { createOrder, validateCoupon } from "@/lib/actions/checkout";
import { formatCents, shippingCentsFor } from "@/lib/store-config";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

const inputCls =
  "w-full rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-brand-cream placeholder:text-white/35 focus:border-brand-gold/60 focus:outline-none";

function PaymentStep({
  clientSecret,
  orderToken,
  totalCents,
}: {
  clientSecret: string;
  orderToken: string;
  totalCents: number;
}) {
  const stripeJs = useStripe();
  const elements = useElements();
  const { clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pay() {
    if (!stripeJs || !elements) return;
    setSubmitting(true);
    setErr(null);
    const { error } = await stripeJs.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/thank-you?order=${orderToken}`,
      },
    });
    // Only reached on immediate failure (redirect otherwise).
    if (error) {
      setErr(error.message ?? "Payment failed — try another method.");
      setSubmitting(false);
    } else {
      clear();
    }
  }

  return (
    <div className="space-y-5">
      <PaymentElement options={{ layout: "tabs" }} />
      {err && <p className="text-sm text-brand-rust">{err}</p>}
      <button
        type="button"
        disabled={submitting}
        onClick={pay}
        className="button-primary w-full text-center disabled:opacity-60"
      >
        {submitting ? "Processing…" : `Pay ${formatCents(totalCents)}`}
      </button>
      <p className="text-center text-xs uppercase tracking-[0.2em] text-white/40">
        Secured by Stripe
      </p>
    </div>
  );
}

export function CheckoutForm({ stripeReady }: { stripeReady: boolean }) {
  const { lines, subtotalCents, keyOf } = useCart();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    company: "", // honeypot
  });
  const [coupon, setCoupon] = useState("");
  const [couponState, setCouponState] = useState<
    { status: "idle" } | { status: "applied"; discountCents: number } | { status: "error"; reason: string }
  >({ status: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [payment, setPayment] = useState<{
    clientSecret: string;
    orderToken: string;
    totalCents: number;
  } | null>(null);

  const shippingEstimate = useMemo(
    () =>
      shippingCentsFor(
        lines.map((l) => ({
          lineTotalCents: l.unitPriceCents * l.quantity,
          freeShipping: l.freeShipping,
        })),
      ),
    [lines],
  );
  const discountEstimate = couponState.status === "applied" ? couponState.discountCents : 0;
  const estimatedTotal = Math.max(0, subtotalCents + shippingEstimate - discountEstimate);

  async function applyCoupon() {
    if (!coupon.trim()) return;
    const res = await validateCoupon(coupon.trim(), subtotalCents);
    setCouponState(
      res.valid
        ? { status: "applied", discountCents: res.discountCents ?? 0 }
        : { status: "error", reason: res.reason ?? "Invalid code." },
    );
  }

  async function begin() {
    setErr(null);
    if (!form.name.trim() || !form.email.trim())
      return setErr("Enter your name and email.");
    if (!form.address1.trim() || !form.city.trim() || !form.state.trim() || !form.zip.trim())
      return setErr("Enter your full shipping address.");
    setSubmitting(true);
    const res = await createOrder({
      lines: lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        sizeKey: l.sizeKey,
        quantity: l.quantity,
      })),
      customer: { name: form.name, email: form.email, phone: form.phone },
      shippingAddress: {
        line1: form.address1,
        line2: form.address2,
        city: form.city,
        state: form.state,
        zip: form.zip,
        country: "US",
      },
      couponCode: couponState.status === "applied" ? coupon.trim() : undefined,
      company: form.company,
    });
    setSubmitting(false);
    if (!res.ok) return setErr(res.error);
    setPayment({
      clientSecret: res.clientSecret,
      orderToken: res.orderToken,
      totalCents: res.totals.totalCents,
    });
  }

  if (lines.length === 0 && !payment) {
    return (
      <div className="section-shell flex flex-col items-center gap-5 py-16 text-center">
        <p className="font-display text-3xl text-brand-cream">Nothing to check out yet.</p>
        <Link href="/shop" className="button-primary">
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <div className="section-shell space-y-6">
        {payment ? (
          stripePromise ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: payment.clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#c7a46a",
                    colorBackground: "#17181b",
                    colorText: "#ece4d6",
                    borderRadius: "12px",
                  },
                },
              }}
            >
              <PaymentStep {...payment} />
            </Elements>
          ) : null
        ) : (
          <>
            <div className="space-y-4">
              <p className="eyebrow">Contact</p>
              {/* Honeypot */}
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input placeholder="Full name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
                <input placeholder="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
              </div>
              <input placeholder="Phone (optional)" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
            </div>

            <div className="space-y-4">
              <p className="eyebrow">Shipping address (US)</p>
              <input placeholder="Street address" autoComplete="address-line1" value={form.address1} onChange={(e) => setForm({ ...form, address1: e.target.value })} className={inputCls} />
              <input placeholder="Apt, suite, etc. (optional)" autoComplete="address-line2" value={form.address2} onChange={(e) => setForm({ ...form, address2: e.target.value })} className={inputCls} />
              <div className="grid gap-4 sm:grid-cols-3">
                <input placeholder="City" autoComplete="address-level2" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
                <input placeholder="State" autoComplete="address-level1" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputCls} />
                <input placeholder="ZIP" autoComplete="postal-code" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className={inputCls} />
              </div>
            </div>

            {err && <p className="text-sm text-brand-rust">{err}</p>}

            {stripeReady ? (
              <button
                type="button"
                disabled={submitting}
                onClick={begin}
                className="button-primary w-full text-center disabled:opacity-60"
              >
                {submitting ? "Preparing payment…" : "Continue to payment"}
              </button>
            ) : (
              <p className="rounded-xl border border-white/12 bg-black/30 px-5 py-4 text-center text-sm text-white/60">
                Secure checkout is coming online — join the list on the shop page for first notice.
              </p>
            )}
          </>
        )}
      </div>

      <aside className="section-shell space-y-4 lg:sticky lg:top-24">
        <p className="font-display text-2xl text-brand-cream">Order summary</p>
        <ul className="space-y-2 text-sm text-white/75">
          {lines.map((l) => (
            <li key={keyOf(l)} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">
                {l.name}
                {l.sizeLabel ? ` — ${l.sizeLabel}` : ""} ×{l.quantity}
              </span>
              <span className="shrink-0 text-brand-cream">
                {formatCents(l.unitPriceCents * l.quantity)}
              </span>
            </li>
          ))}
        </ul>

        {!payment && (
          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="flex gap-2">
              <input
                placeholder="Coupon code"
                value={coupon}
                onChange={(e) => {
                  setCoupon(e.target.value);
                  setCouponState({ status: "idle" });
                }}
                className={`${inputCls} flex-1`}
              />
              <button type="button" onClick={applyCoupon} className="button-secondary shrink-0">
                Apply
              </button>
            </div>
            {couponState.status === "applied" && (
              <p className="text-sm text-brand-gold">
                Code applied — you save {formatCents(couponState.discountCents)}.
              </p>
            )}
            {couponState.status === "error" && (
              <p className="text-sm text-brand-rust">{couponState.reason}</p>
            )}
          </div>
        )}

        <dl className="space-y-2 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between text-white/70">
            <dt>Subtotal</dt>
            <dd className="text-brand-cream">{formatCents(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between text-white/70">
            <dt>Shipping</dt>
            <dd className="text-brand-cream">
              {shippingEstimate === 0 ? "Free" : formatCents(shippingEstimate)}
            </dd>
          </div>
          {discountEstimate > 0 && (
            <div className="flex justify-between text-brand-gold">
              <dt>Discount</dt>
              <dd>−{formatCents(discountEstimate)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-white/10 pt-3">
            <dt className="text-brand-cream">Total</dt>
            <dd className="font-display text-2xl text-brand-cream">
              {formatCents(payment ? payment.totalCents : estimatedTotal)}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
