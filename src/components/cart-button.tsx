"use client";

import { useCart } from "./cart/cart-provider";

/** Header cart trigger with live count badge. */
export function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={count > 0 ? `Open cart (${count} items)` : "Open cart"}
      className="relative rounded-full border border-white/12 p-2.5 text-brand-cream/85 transition hover:border-brand-gold/50 hover:text-brand-gold"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-gold px-1 text-[11px] font-bold text-brand-obsidian">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
