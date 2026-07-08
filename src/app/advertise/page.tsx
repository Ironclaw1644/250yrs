import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Advertise Your Business",
  description:
    "Advertise your local business on True American Where for $19.99/month or $100/year. Photos, hours, menu, reviews, coupons, orders, bookings, and local search placement included.",
  alternates: { canonical: "/advertise" },
};

const INCLUDED = [
  "Your own business profile page",
  "Photos of your shop, food & work",
  "Address, phone & one-tap Call Now",
  "Business hours & directions",
  "Service list or full menu with prices",
  "Customer reviews & your replies",
  "Coupons & daily specials",
  "Local search placement (your city & category)",
  "Take orders & bookings online (paid out to you)",
];

const ADDONS = [
  { icon: "comment", title: "Video ads", body: "Play a short commercial right on your page." },
  { icon: "tag", title: "Featured placement", body: "Front-page spot in your city and state." },
  { icon: "bullhorn", title: "Coupon campaigns", body: "Blast a deal to nearby customers." },
  { icon: "star", title: "Daily specials", body: "Pin today's special to the top." },
  { icon: "share-nodes", title: "Promo emails", body: "Email customers who saved you." },
];

const startHref = "/dashboard/new";

export default function AdvertisePage() {
  return (
    <>
      <section className="container-shell pt-10">
        <div className="sign-plate flex flex-col items-center gap-5 px-6 py-12 text-center sm:px-12">
          <span className="pin-badge h-16 w-16">
            <Icon name="bullhorn" className="text-2xl" />
          </span>
          <p className="font-heading text-eyebrow font-semibold uppercase tracking-widest text-gold">
            For business owners
          </p>
          <h1 className="stamp text-3xl text-cream sm:text-5xl">
            GET FOUND BY LOCAL CUSTOMERS
          </h1>
          <p className="max-w-xl text-cream/85">
            Put your shop on the map customers actually use. Simple to set up, no
            tech skills needed — reach people in your city, your state, and
            around the world.
          </p>
          <Link href={startHref} className="btn btn-gold">
            <Icon name="arrow-right" /> Get started
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section className="container-shell py-14 sm:py-20">
        <div className="mb-10 text-center">
          <p className="eyebrow">Simple pricing</p>
          <h2 className="mt-1 font-heading text-h1 text-navy">
            One low price. Everything included.
          </h2>
        </div>
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          {/* Monthly */}
          <div className="card flex flex-col p-8">
            <p className="eyebrow">Monthly</p>
            <p className="mt-2 font-heading text-navy">
              <span className="text-5xl font-bold">$19.99</span>
              <span className="text-lead text-stone"> / month</span>
            </p>
            <p className="mt-1 text-small text-stone">Billed monthly. Cancel anytime.</p>
            <Link href={startHref} className="btn btn-secondary mt-6">
              Choose monthly
            </Link>
          </div>
          {/* Annual */}
          <div className="card relative flex flex-col p-8 shadow-raised">
            <span className="absolute right-5 top-5 rounded-full bg-gold px-3 py-1 font-heading text-xs font-semibold uppercase tracking-wide text-navy-deep">
              Save $140
            </span>
            <p className="eyebrow">Yearly</p>
            <p className="mt-2 font-heading text-navy">
              <span className="text-5xl font-bold">$100</span>
              <span className="text-lead text-stone"> / year</span>
            </p>
            <p className="mt-1 text-small text-stone">Best value — under $9 a month.</p>
            <Link href={startHref} className="btn btn-primary mt-6">
              Choose yearly
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <h3 className="mb-4 text-center font-heading text-h3 text-navy">
            Every plan includes
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {INCLUDED.map((f) => (
              <li key={f} className="flex items-start gap-3 text-char">
                <Icon name="circle-check" className="mt-1 text-success" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-small text-stone">
            Online checkout is being set up. Tap{" "}
            <span className="font-semibold text-navy">Get started</span> and
            we&apos;ll have your page live in minutes.
          </p>
        </div>
      </section>

      {/* Add-ons */}
      <section className="bg-linen/60">
        <div className="container-shell py-14 sm:py-20">
          <div className="mb-10 text-center">
            <p className="eyebrow">Optional add-ons</p>
            <h2 className="mt-1 font-heading text-h1 text-navy">
              Stand out even more
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {ADDONS.map((a) => (
              <div key={a.title} className="card p-5 text-center">
                <span className="pin-badge mx-auto h-12 w-12">
                  <Icon name={a.icon} />
                </span>
                <h3 className="mt-3 font-heading text-lg text-navy">{a.title}</h3>
                <p className="mt-1 text-small text-stone">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-16 text-center">
        <h2 className="font-heading text-h1 text-navy">Ready when you are.</h2>
        <p className="mx-auto mt-2 max-w-xl text-stone">
          Join the local businesses getting found on True American Where.
        </p>
        <Link href={startHref} className="btn btn-gold mt-6">
          <Icon name="bullhorn" /> Advertise your business
        </Link>
      </section>
    </>
  );
}
