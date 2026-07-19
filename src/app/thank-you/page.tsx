import type { Metadata } from "next";
import Link from "next/link";

import { OrderSummary } from "@/components/order-summary";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getOrderByToken } from "@/lib/store-queries";

export const metadata: Metadata = {
  title: "Thank You",
  robots: { index: false },
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: token } = await searchParams;
  const order = token ? await getOrderByToken(token) : null;

  return (
    <>
      <SiteHeader />
      <main className="pb-20 pt-10">
        <section className="container-shell">
          <div className="section-shell mx-auto max-w-3xl space-y-8 text-center">
            <div className="space-y-3">
              <p className="eyebrow">Order confirmed</p>
              <h1 className="font-display text-5xl text-brand-cream">
                Welcome to the 250th.
              </h1>
              <p className="mx-auto max-w-xl text-white/70">
                {order
                  ? `Thank you, ${order.customer_name.split(" ")[0]} — your confirmation is on its way to ${order.customer_email}.`
                  : "Thank you — your order is confirmed and a receipt is on its way to your email."}
              </p>
            </div>

            {order && <OrderSummary order={order} />}

            <div className="flex flex-wrap justify-center gap-3">
              {order && (
                <Link href={`/order/${order.confirmation_token}`} className="button-secondary">
                  View order details
                </Link>
              )}
              <Link href="/shop" className="button-primary">
                Keep shopping
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
