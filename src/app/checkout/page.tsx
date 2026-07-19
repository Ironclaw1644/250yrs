import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout-form";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { stripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main className="pb-20 pt-10">
        <section className="container-shell space-y-8">
          <SectionHeading
            as="h1"
            eyebrow="Secure checkout"
            title="Claim your piece of the 250th."
            description="Your order ships from the US. Free shipping over $125."
          />
          <CheckoutForm stripeReady={stripeConfigured} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
