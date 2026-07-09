import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { Editable } from "@/components/Editable";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Find real local businesses in three taps — or list your own and reach customers in your city. Here's how True American Where works.",
  alternates: { canonical: "/how-it-works" },
};

const CUSTOMER_STEPS = [
  { icon: "location-crosshairs", title: "Choose your area", body: "Pick your country, state, and city — or just search for what you need." },
  { icon: "store", title: "Find real local shops", body: "Browse fried food, barbers, tire shops, markets, and more — with photos, hours, and prices." },
  { icon: "phone", title: "Call, visit, or save", body: "Tap to call, get directions, grab a coupon, save a favorite, and leave a review." },
];

const OWNER_STEPS = [
  { icon: "pen-to-square", title: "Create your listing", body: "Add your shop's name, category, address, and phone — it takes about a minute." },
  { icon: "image", title: "Add photos & details", body: "Upload photos, set your hours, and list your menu or services with prices." },
  { icon: "bullhorn", title: "Go live & get found", body: "Pick a plan ($19.99/mo or $100/yr) and your business appears in local search." },
  { icon: "chart-line", title: "Watch it work", body: "See how many people viewed your page, called, and asked for directions." },
];

export default function HowItWorksPage() {
  return (
    <div className="container-shell py-10">
      <p className="eyebrow">How it works</p>
      <h1 className="font-heading text-h1 text-navy">
        <Editable id="copy.how.title">Local, in three taps</Editable>
      </h1>
      <p className="mt-2 max-w-2xl text-lead text-stone">
        <Editable id="copy.how.intro">
          True American Where connects everyday customers with the real local
          stores in their neighborhood — and gives those businesses an easy,
          affordable way to be found.
        </Editable>
      </p>

      <section className="mt-12">
        <h2 className="mb-8 font-heading text-h2 text-navy">For customers</h2>
        <ol className="grid gap-8 md:grid-cols-3">
          {CUSTOMER_STEPS.map((s, i) => (
            <li key={s.title} className="card p-6 text-center">
              <span className="pin-badge mx-auto h-16 w-16">
                <Icon name={s.icon} className="text-2xl" />
              </span>
              <h3 className="mt-4 font-heading text-h3 text-navy">
                {i + 1}. {s.title}
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-stone">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 text-center">
          <Link href="/us" className="btn btn-primary">
            <Icon name="magnifying-glass" /> Start exploring
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-8 font-heading text-h2 text-navy">For business owners</h2>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {OWNER_STEPS.map((s, i) => (
            <li key={s.title} className="card p-6 text-center">
              <span className="pin-badge mx-auto h-14 w-14">
                <Icon name={s.icon} className="text-xl" />
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold text-navy">
                {i + 1}. {s.title}
              </h3>
              <p className="mt-2 text-small text-stone">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 text-center">
          <Link href="/advertise" className="btn btn-gold">
            <Icon name="bullhorn" /> List your business
          </Link>
        </div>
      </section>
    </div>
  );
}
