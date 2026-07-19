"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "./cart-provider";
import { formatCents, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/store-config";

/** Slide-out cart panel — dark-luxury glass, matches the section-shell language. */
export function CartDrawer() {
  const { lines, count, subtotalCents, open, setOpen, setQuantity, remove, keyOf } = useCart();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  const freeShipGap = FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents;

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[70] transition-opacity duration-std ease-warm ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <button
        type="button"
        aria-label="Close cart"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-brand-charcoal shadow-2xl transition-transform duration-entrance ease-warm ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <p className="font-display text-xl text-brand-cream">
            Your cart{count > 0 && <span className="ml-2 text-brand-gold">({count})</span>}
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-2 text-brand-cream/70 transition-colors hover:text-brand-gold"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-brand-cream/70">Your cart is empty.</p>
            <Link href="/shop" onClick={() => setOpen(false)} className="button-primary">
              Shop the collection
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-white/10 overflow-y-auto px-6">
              {lines.map((l) => {
                const key = keyOf(l);
                return (
                  <li key={key} className="flex gap-4 py-4">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-gunmetal">
                      {l.imageUrl && (
                        <Image src={l.imageUrl} alt={l.name} fill sizes="64px" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/shop/${l.slug}`}
                        onClick={() => setOpen(false)}
                        className="block truncate font-medium text-brand-cream hover:text-brand-gold"
                      >
                        {l.name}
                      </Link>
                      <p className="mt-0.5 text-sm text-brand-cream/60">
                        {[l.variantLabel, l.sizeLabel].filter(Boolean).join(" · ")}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center rounded-full border border-white/15">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => setQuantity(key, l.quantity - 1)}
                            className="px-2.5 py-1 text-brand-cream/80 hover:text-brand-gold"
                          >
                            −
                          </button>
                          <span className="min-w-6 text-center text-sm text-brand-cream">{l.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => setQuantity(key, l.quantity + 1)}
                            className="px-2.5 py-1 text-brand-cream/80 hover:text-brand-gold"
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
                    <p className="shrink-0 font-medium text-brand-cream">
                      {formatCents(l.unitPriceCents * l.quantity)}
                    </p>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-white/10 px-6 py-5">
              {freeShipGap > 0 ? (
                <p className="mb-3 text-center text-xs uppercase tracking-wide text-brand-cream/60">
                  {formatCents(freeShipGap)} away from free shipping
                </p>
              ) : (
                <p className="mb-3 text-center text-xs uppercase tracking-wide text-brand-gold">
                  Free shipping unlocked
                </p>
              )}
              <div className="mb-4 flex items-center justify-between text-brand-cream">
                <span className="text-sm uppercase tracking-wide text-brand-cream/70">Subtotal</span>
                <span className="font-display text-2xl">{formatCents(subtotalCents)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="button-primary block w-full text-center"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className="mt-2 block w-full text-center text-sm text-brand-cream/60 underline-offset-4 hover:text-brand-gold hover:underline"
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
