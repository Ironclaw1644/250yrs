import type { Metadata } from "next";
import Image from "next/image";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Site Paused",
  robots: { index: false, follow: false },
};

const PAYMENT_LINK = "https://buy.stripe.com/3cI5kCeOw5YUbHxbyD0Ny0p";

const LINE_ITEMS = [
  { label: "Website design & build", amount: "$300" },
  { label: "Stripe & database integration", amount: "$300" },
  { label: "Domain registration", amount: "$100" },
  { label: "Credit already paid", amount: "–$100" },
];

export default function SitePausedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-deep px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="flex justify-center">
          <Image
            src="/brand/logo.png"
            alt={brand.name}
            width={72}
            height={72}
            className="rounded-full"
            priority
          />
        </div>

        <div className="sign-plate mt-6 p-8 sm:p-10">
          <p className="text-center font-sans text-eyebrow font-bold uppercase tracking-[0.14em] text-gold">
            {brand.name}
          </p>
          <h1 className="mt-3 text-center font-display text-h1 leading-tight text-cream">
            Your site is built and ready.
          </h1>
          <p className="mt-4 text-center text-body text-cream/90">
            Development is complete, but this site is temporarily paused
            while the outstanding invoice is settled. As soon as payment is
            received, it will be back online.
          </p>

          <div className="mt-8 rounded-lg border border-cream/15 bg-navy/40 p-5">
            <ul className="divide-y divide-cream/10">
              {LINE_ITEMS.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between py-2 text-small text-cream/90"
                >
                  <span>{item.label}</span>
                  <span className="font-sans font-semibold text-cream">
                    {item.amount}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between border-t border-cream/20 pt-3">
              <span className="font-heading text-small font-bold uppercase tracking-wide text-gold">
                Total due
              </span>
              <span className="font-display text-h2 text-gold">$600</span>
            </div>
          </div>

          <a
            href={PAYMENT_LINK}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary mt-7 w-full justify-center py-3.5 text-lead"
          >
            Complete Payment — $600
          </a>

          <p className="mt-5 text-center text-xs text-cream/60">
            Secure payment via Stripe. Questions about this invoice? Reach out
            to your project developer directly.
          </p>
        </div>
      </div>
    </main>
  );
}
