import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderSummary } from "@/components/order-summary";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getOrderByToken } from "@/lib/store-queries";

export const metadata: Metadata = {
  title: "Your Order",
  robots: { index: false },
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) notFound();

  const ship = order.shipping_address;

  return (
    <>
      <SiteHeader />
      <main className="pb-20 pt-10">
        <section className="container-shell">
          <div className="section-shell mx-auto max-w-3xl space-y-8">
            <div className="space-y-3 text-center">
              <p className="eyebrow">Your order</p>
              <h1 className="font-display text-5xl text-brand-cream">{order.order_number}</h1>
              <p className="text-white/65">
                Placed {new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>

            <OrderSummary order={order} />

            {ship && (
              <div className="rounded-[1.6rem] border border-white/8 bg-black/25 p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-brand-gold/70">Shipping to</p>
                <p className="mt-2 text-white/80">
                  {order.customer_name}
                  <br />
                  {[ship.line1, ship.line2].filter(Boolean).join(", ")}
                  <br />
                  {[ship.city, ship.state, ship.zip].filter(Boolean).join(", ")}
                </p>
              </div>
            )}

            <div className="text-center">
              <Link href="/shop" className="button-primary">
                Back to the collection
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
