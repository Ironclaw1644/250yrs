"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./cart-provider";
import {
  formatCents,
  shippingCentsFor,
} from "@/lib/store-config";

/** Full-page cart (the drawer's big sibling) with an order summary. */
export function CartView() {
  const { lines, subtotalCents, setQuantity, remove, keyOf } = useCart();

  const shipping = shippingCentsFor(
    lines.map((l) => ({
      lineTotalCents: l.unitPriceCents * l.quantity,
      freeShipping: l.freeShipping,
    })),
  );

  if (lines.length === 0) {
    return (
      <div className="section-shell flex flex-col items-center gap-5 py-16 text-center">
        <p className="font-display text-3xl text-brand-cream">Your cart is empty.</p>
        <p className="max-w-md text-white/65">
          The 250th Year Collection is waiting — limited runs, numbered sets, built to last.
        </p>
        <Link href="/shop" className="button-primary">
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
      <ul className="section-shell divide-y divide-white/8 !p-0">
        {lines.map((l) => {
          const key = keyOf(l);
          return (
            <li key={key} className="flex gap-5 p-5">
              <Link
                href={`/shop/${l.slug}`}
                className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-gunmetal"
              >
                {l.imageUrl && (
                  <Image src={l.imageUrl} alt={l.name} fill sizes="96px" className="object-cover" />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/shop/${l.slug}`}
                  className="font-display text-xl text-brand-cream hover:text-brand-gold"
                >
                  {l.name}
                </Link>
                <p className="mt-1 text-sm text-brand-cream/60">
                  {[l.variantLabel, l.sizeLabel].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center rounded-full border border-white/15">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(key, l.quantity - 1)}
                      className="px-3 py-1.5 text-brand-cream/80 hover:text-brand-gold"
                    >
                      −
                    </button>
                    <span className="min-w-7 text-center text-brand-cream">{l.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(key, l.quantity + 1)}
                      className="px-3 py-1.5 text-brand-cream/80 hover:text-brand-gold"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(key)}
                    className="text-xs uppercase tracking-wide text-brand-cream/50 hover:text-brand-rust"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="shrink-0 text-lg font-medium text-brand-cream">
                {formatCents(l.unitPriceCents * l.quantity)}
              </p>
            </li>
          );
        })}
      </ul>

      <aside className="section-shell space-y-4 lg:sticky lg:top-24">
        <p className="font-display text-2xl text-brand-cream">Order summary</p>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between text-white/70">
            <dt>Subtotal</dt>
            <dd className="text-brand-cream">{formatCents(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between text-white/70">
            <dt>Shipping</dt>
            <dd className="text-brand-cream">
              {shipping === 0 ? "Free" : formatCents(shipping)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3 text-base">
            <dt className="text-brand-cream">Estimated total</dt>
            <dd className="font-display text-2xl text-brand-cream">
              {formatCents(subtotalCents + shipping)}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-white/50">
          Coupons and shipping details are applied at checkout.
        </p>
        <Link href="/checkout" className="button-primary block w-full text-center">
          Checkout
        </Link>
        <p className="text-center text-xs uppercase tracking-[0.2em] text-white/40">
          Secure checkout by Stripe
        </p>
      </aside>
    </div>
  );
}
