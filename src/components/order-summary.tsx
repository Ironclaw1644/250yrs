import { formatCents } from "@/lib/store-config";
import type { OrderWithItems } from "@/lib/store-types";

/** Shared order line-item + totals block (thank-you page and /order/[token]). */
export function OrderSummary({ order }: { order: OrderWithItems }) {
  return (
    <div className="rounded-[1.6rem] border border-white/8 bg-black/25 p-6 text-left">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
        <p className="font-display text-xl text-brand-cream">{order.order_number}</p>
        <p className="text-xs uppercase tracking-[0.2em] text-brand-gold/80">
          {order.payment_status === "paid" ? "Paid" : order.payment_status}
          {" · "}
          {order.status}
        </p>
      </div>
      <ul className="divide-y divide-white/8">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-brand-cream">{item.product_name}</p>
              <p className="text-sm text-white/55">
                {[item.variant_label, item.size].filter(Boolean).join(" · ")}
                {item.quantity > 1 ? ` · ×${item.quantity}` : ""}
              </p>
            </div>
            <p className="shrink-0 text-brand-cream">{formatCents(item.line_total_cents)}</p>
          </li>
        ))}
      </ul>
      <dl className="space-y-1.5 border-t border-white/10 pt-4 text-sm">
        <div className="flex justify-between text-white/65">
          <dt>Subtotal</dt>
          <dd>{formatCents(order.subtotal_cents)}</dd>
        </div>
        <div className="flex justify-between text-white/65">
          <dt>Shipping</dt>
          <dd>{order.shipping_cents === 0 ? "Free" : formatCents(order.shipping_cents)}</dd>
        </div>
        {order.discount_cents > 0 && (
          <div className="flex justify-between text-brand-gold">
            <dt>Discount{order.discount_code ? ` (${order.discount_code})` : ""}</dt>
            <dd>−{formatCents(order.discount_cents)}</dd>
          </div>
        )}
        <div className="flex justify-between pt-2 text-base">
          <dt className="text-brand-cream">Total</dt>
          <dd className="font-display text-2xl text-brand-cream">
            {formatCents(order.total_cents)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
