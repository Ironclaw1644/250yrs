import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusControls } from "@/components/admin/order-status-controls";
import { OrderSummary } from "@/components/order-summary";
import { adminOrder } from "@/lib/admin-queries";

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await adminOrder(id);
  if (!order) notFound();
  const ship = order.shipping_address;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/orders" className="text-sm text-white/50 hover:text-brand-cream">
          ← Orders
        </Link>
        <h1 className="mt-1 font-display text-4xl text-brand-cream">{order.order_number}</h1>
        <p className="mt-1 text-sm text-white/50">
          {new Date(order.created_at).toLocaleString("en-US")} · {order.customer_email}
          {order.customer_phone ? ` · ${order.customer_phone}` : ""}
        </p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
        <p className="eyebrow">Fulfillment status</p>
        <div className="mt-3">
          <OrderStatusControls orderId={order.id} status={order.status} />
        </div>
      </div>

      <OrderSummary order={order} />

      {ship && (
        <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
          <p className="eyebrow">Ship to</p>
          <p className="mt-2 text-white/80">
            {order.customer_name}
            <br />
            {[ship.line1, ship.line2].filter(Boolean).join(", ")}
            <br />
            {[ship.city, ship.state, ship.zip].filter(Boolean).join(", ")}
          </p>
        </div>
      )}

      {order.stripe_payment_intent_id && (
        <p className="text-xs text-white/40">
          Stripe payment: <span className="font-mono">{order.stripe_payment_intent_id}</span>
        </p>
      )}
    </div>
  );
}
