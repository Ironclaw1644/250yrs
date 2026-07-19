import Link from "next/link";
import { adminOrders } from "@/lib/admin-queries";
import { formatCents } from "@/lib/store-config";

const TABS = ["all", "pending", "confirmed", "fulfilled", "cancelled"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = TABS.includes(status ?? "") ? status! : "all";
  const orders = await adminOrders(active);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Orders</p>
        <h1 className="font-display text-4xl text-brand-cream">Orders</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t}
            href={t === "all" ? "/admin/orders" : `/admin/orders?status=${t}`}
            className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.16em] transition ${
              active === t
                ? "border-brand-gold bg-brand-gold/15 text-brand-cream"
                : "border-white/10 text-white/60 hover:text-brand-cream"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-white/50">
          No orders here yet.
        </p>
      ) : (
        <ul className="grid gap-2">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/5 p-4 transition hover:border-brand-gold/40"
              >
                <div className="min-w-0">
                  <p className="text-brand-cream">{o.order_number}</p>
                  <p className="truncate text-sm text-white/50">
                    {o.customer_name} · {new Date(o.created_at).toLocaleDateString("en-US")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-wide ${
                      o.payment_status === "paid"
                        ? "bg-brand-gold/15 text-brand-gold"
                        : o.payment_status === "failed"
                          ? "bg-brand-rust/20 text-brand-rust"
                          : "bg-white/10 text-white/60"
                    }`}
                  >
                    {o.payment_status}
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-white/70">
                    {o.status}
                  </span>
                  <span className="text-brand-cream">{formatCents(o.total_cents)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
