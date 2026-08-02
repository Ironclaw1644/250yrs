import type { Metadata } from "next";
import Image from "next/image";
import { brand, CATEGORIES } from "@/lib/brand";
import { Icon } from "@/components/Icon";

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

const FEATURES = [
  {
    icon: "magnifying-glass",
    title: "Searchable Business Directory",
    body: "Customers find real local businesses by category, city, and state.",
  },
  {
    icon: "wand-magic-sparkles",
    title: "AI Ad Studio",
    body: "Guided presets turn a single photo into a professional TV-style commercial.",
  },
  {
    icon: "gauge-high",
    title: "Owner Dashboard",
    body: "Businesses manage hours, photos, menus, and services in one place.",
  },
  {
    icon: "bullhorn",
    title: "Advertising Plans",
    body: "Monthly or annual placements that help businesses get found first.",
  },
  {
    icon: "star",
    title: "Verified Reviews",
    body: "Customers rate and review real experiences at real businesses.",
  },
  {
    icon: "heart",
    title: "Saved Favorites",
    body: "Customers build a running list of their go-to local spots.",
  },
  {
    icon: "bell",
    title: "Automatic Notifications",
    body: "Owners and customers stay in the loop without lifting a finger.",
  },
  {
    icon: "bag-shopping",
    title: "Secure Stripe Checkout",
    body: "Built-in payments for advertising subscriptions and video credit packs.",
  },
  {
    icon: "shield-halved",
    title: "Full Admin Control Panel",
    body: "Moderation, analytics, and content management, all in one dashboard.",
  },
] as const;

export default function SitePausedPage() {
  return (
    <main className="min-h-screen bg-navy-deep px-4 py-16">
      <div className="mx-auto w-full max-w-lg">
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

      {/* ============ Preview: everything the site includes ============ */}
      <div className="mx-auto mt-16 w-full max-w-4xl">
        <p className="text-center font-sans text-eyebrow font-bold uppercase tracking-[0.14em] text-gold">
          A preview of what's waiting behind this page
        </p>
        <h2 className="mt-2 text-center font-display text-h2 text-cream">
          Everything your marketplace includes
        </h2>

        <div className="mt-8 rounded-lg border border-cream/15 bg-navy/40 p-5 sm:p-7">
          <p className="font-heading text-small font-bold uppercase tracking-wide text-gold">
            {CATEGORIES.length} local categories, ready on day one
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <span
                key={c.slug}
                className="inline-flex items-center gap-1.5 rounded-full border border-cream/15 bg-navy/60 px-3 py-1.5 text-small text-cream/90"
              >
                <Icon name={c.icon} className="text-xs text-gold" />
                {c.name}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-cream/15 bg-navy/40 p-5"
            >
              <Icon name={f.icon} className="text-xl text-gold" />
              <p className="mt-3 font-heading font-bold text-cream">
                {f.title}
              </p>
              <p className="mt-1 text-small text-cream/80">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
