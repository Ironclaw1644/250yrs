import Link from "next/link";
import { adminDashboard } from "@/lib/admin-queries";
import { formatCents } from "@/lib/store-config";

export default async function AdminDashboardPage() {
  const d = await adminDashboard();
  const KPIS = [
    { label: "Revenue (paid)", value: formatCents(d.revenueCents) },
    { label: "Paid orders", value: d.paidOrders },
    { label: "Awaiting fulfillment", value: d.pendingFulfillment },
    { label: "Subscribers", value: d.subscribers },
    { label: "Page views (7d)", value: d.views7d },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1 className="font-display text-4xl text-brand-cream">The store at a glance</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <p className="font-display text-3xl text-brand-cream">{k.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-white/50">{k.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-white/8 bg-white/5 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-brand-cream">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-brand-gold hover:underline">
            View all
          </Link>
        </div>
        {d.recentOrders.length === 0 ? (
          <p className="py-6 text-center text-white/50">No orders yet — they&apos;ll land here.</p>
        ) : (
          <ul className="divide-y divide-white/8">
            {d.recentOrders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-white/5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-brand-cream">{o.order_number}</span>
                    <span className="block truncate text-sm text-white/50">
                      {o.customer_name} · {o.customer_email}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
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
                    <span className="text-brand-cream">{formatCents(o.total_cents)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
