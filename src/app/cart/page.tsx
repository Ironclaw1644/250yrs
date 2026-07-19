import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Your Cart",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main className="pb-20 pt-10">
        <section className="container-shell space-y-8">
          <SectionHeading
            as="h1"
            eyebrow="Your cart"
            title="Almost yours."
            description="Review your pieces, then head to secure checkout."
          />
          <CartView />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
