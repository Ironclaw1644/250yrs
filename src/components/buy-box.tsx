"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./cart/cart-provider";
import { formatCents } from "@/lib/store-config";
import {
  sizeDimensions,
  sizeLabel,
  unitPriceCents,
  primaryImage,
  type StoreProduct,
} from "@/lib/store-types";

/**
 * The PDP purchase column: real size selection (single dimension for garments,
 * grouped dimensions for sets), optional variant swatches, quantity, and
 * Add to Cart / Buy Now. Prices are display-only — checkout re-prices from
 * the database, so nothing here is trusted.
 */
export function BuyBox({ product }: { product: StoreProduct }) {
  const router = useRouter();
  const { add } = useCart();
  const { plain, groups } = useMemo(() => sizeDimensions(product.sizes), [product.sizes]);

  const [variantId, setVariantId] = useState<string | null>(
    product.variants[0]?.id ?? null,
  );
  const [plainSize, setPlainSize] = useState<string | null>(null);
  const [groupSizes, setGroupSizes] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [err, setErr] = useState<string | null>(null);

  const soldOut = product.status === "sold";
  const needsPlain = plain.length > 0;
  const needsGroups = groups.length > 0;

  const selectionComplete =
    (!needsPlain || plainSize !== null) &&
    (!needsGroups || groups.every((g) => groupSizes[g.key]));

  const price = unitPriceCents(product, variantId);

  function currentSelection() {
    if (needsGroups) {
      const parts = groups.map((g) => groupSizes[g.key]);
      return {
        sizeKey: parts.join("|"),
        sizeLabel: parts.map((p) => sizeLabel(p)).join(" · "),
      };
    }
    if (needsPlain && plainSize) return { sizeKey: plainSize, sizeLabel: sizeLabel(plainSize) };
    return { sizeKey: null, sizeLabel: null };
  }

  function addToCart(): boolean {
    setErr(null);
    if (!selectionComplete) {
      setErr(needsGroups ? "Choose your sizes first." : "Choose a size first.");
      return false;
    }
    const sel = currentSelection();
    const variant = variantId ? product.variants.find((v) => v.id === variantId) : null;
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantId: variant?.id ?? null,
        variantLabel: variant?.label ?? null,
        sizeKey: sel.sizeKey,
        sizeLabel: sel.sizeLabel,
        unitPriceCents: price,
        imageUrl: primaryImage(product)?.public_url ?? null,
        freeShipping: product.free_shipping,
      },
      quantity,
    );
    return true;
  }

  const chip = (selected: boolean) =>
    `rounded-full border px-4 py-2 text-sm transition ${
      selected
        ? "border-brand-gold bg-brand-gold/15 text-brand-cream"
        : "border-white/10 bg-black/30 text-white/80 hover:border-brand-gold/35 hover:text-brand-cream"
    }`;

  return (
    <div className="space-y-5">
      {product.variants.length > 0 && (
        <div className="rounded-[1.6rem] border border-white/8 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-brand-gold/70">Style</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={variantId === v.id}
                onClick={() => setVariantId(v.id)}
                className={chip(variantId === v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {needsPlain && (
        <div className="rounded-[1.6rem] border border-white/8 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-brand-gold/70">Size</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {plain.map((s) => {
              const out = s.inventory !== null && s.inventory <= 0;
              return (
                <button
                  key={s.size}
                  type="button"
                  disabled={out}
                  aria-pressed={plainSize === s.size}
                  onClick={() => setPlainSize(s.size)}
                  className={`${chip(plainSize === s.size)} ${out ? "opacity-40 line-through" : ""}`}
                >
                  {sizeLabel(s.size)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {groups.map((g) => (
        <div key={g.key} className="rounded-[1.6rem] border border-white/8 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-brand-gold/70">{g.label}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {g.sizes.map((s) => {
              const out = s.inventory !== null && s.inventory <= 0;
              const selected = groupSizes[g.key] === s.size;
              return (
                <button
                  key={s.size}
                  type="button"
                  disabled={out}
                  aria-pressed={selected}
                  onClick={() => setGroupSizes((prev) => ({ ...prev, [g.key]: s.size }))}
                  className={`${chip(selected)} ${out ? "opacity-40 line-through" : ""}`}
                >
                  {sizeLabel(s.size)}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center rounded-full border border-white/15">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-4 py-2.5 text-brand-cream/80 hover:text-brand-gold"
          >
            −
          </button>
          <span className="min-w-8 text-center text-brand-cream">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            className="px-4 py-2.5 text-brand-cream/80 hover:text-brand-gold"
          >
            +
          </button>
        </div>
        <p className="font-display text-3xl text-brand-cream">
          {formatCents(price * quantity)}
        </p>
      </div>

      {err && <p className="text-sm text-brand-rust">{err}</p>}

      {soldOut ? (
        <p className="rounded-full border border-white/15 px-6 py-3 text-center text-sm uppercase tracking-[0.2em] text-white/60">
          Sold out
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={addToCart} className="button-primary flex-1 text-center">
            Add to cart
          </button>
          <button
            type="button"
            onClick={() => {
              if (addToCart()) router.push("/checkout");
            }}
            className="button-secondary flex-1 text-center"
          >
            Buy now
          </button>
        </div>
      )}

      <p className="text-xs uppercase tracking-[0.2em] text-white/40">
        Secure checkout by Stripe · Free US shipping over $125
      </p>
    </div>
  );
}
