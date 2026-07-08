import Link from "next/link";
import { brand, CATEGORIES } from "@/lib/brand";
import { Icon } from "@/components/Icon";
import { SearchBar } from "@/components/SearchBar";
import { CategoryTile } from "@/components/CategoryTile";

const CHIPS = [
  { icon: "magnifying-glass", label: "Search Nearby", tone: "gold" },
  { icon: "tag", label: "Exclusive Deals", tone: "barn" },
  { icon: "heart", label: "Save Favorites", tone: "gold" },
  { icon: "comment", label: "Leave Reviews", tone: "gold" },
  { icon: "phone", label: "Call Now", tone: "barn" },
];

const STEPS = [
  { icon: "location-crosshairs", title: "Choose your area", body: "Pick your country, state, and city — or just search what you need." },
  { icon: "store", title: "Find real local shops", body: "Browse fried food, barbers, tire shops, markets, and more — with photos, hours, and prices." },
  { icon: "phone", title: "Call, order, or book", body: "Tap to call, get directions, grab a coupon, order food, or book an appointment." },
];

export default function HomePage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="paper-grain relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-[-10%] mx-auto h-[420px] max-w-4xl rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(240,168,24,0.22), transparent)" }}
        />
        <div className="container-shell relative py-14 text-center sm:py-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brand.logo}
            alt={brand.name}
            className="reveal mx-auto w-full max-w-lg animate-sign-sway drop-shadow-[0_20px_45px_rgba(6,18,29,0.28)]"
            style={{ "--i": 0 } as React.CSSProperties}
          />
          <p
            className="reveal mx-auto mt-7 max-w-2xl font-heading text-lead font-medium uppercase tracking-wide text-navy sm:text-h3"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            {brand.slogan}
          </p>
          <div
            className="reveal mx-auto mt-8 max-w-2xl"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <SearchBar size="lg" />
          </div>

          {/* Action chips (from the logo mockup) */}
          <ul
            className="reveal mx-auto mt-10 flex max-w-3xl flex-wrap items-start justify-center gap-x-8 gap-y-6"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            {CHIPS.map((c) => (
              <li key={c.label} className="flex w-20 flex-col items-center gap-2 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-navy shadow-card">
                  <Icon name={c.icon} className={c.tone === "barn" ? "text-lg text-barn" : "text-lg text-gold"} />
                </span>
                <span className="font-heading text-xs font-semibold uppercase leading-tight tracking-wide text-navy">
                  {c.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="container-shell py-14 sm:py-20">
        <div className="mb-8 text-center">
          <p className="eyebrow">Browse by category</p>
          <h2 className="mt-1 font-heading text-h1 text-navy">What are you looking for?</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <div key={c.slug} className="reveal" style={{ "--i": i } as React.CSSProperties}>
              <CategoryTile category={c} href={`/categories/${c.slug}`} />
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="bg-linen/60">
        <div className="container-shell py-14 sm:py-20">
          <div className="mb-10 text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-1 font-heading text-h1 text-navy">Local, in three taps</h2>
          </div>
          <ol className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="text-center">
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
        </div>
      </section>

      {/* ===== FEATURED AREA ===== */}
      <section className="container-shell py-14 sm:py-20">
        <div className="card flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Now serving</p>
            <h2 className="mt-1 font-heading text-h2 text-navy">Berea, Kentucky</h2>
            <p className="mt-2 max-w-xl text-stone">
              Fried fish, fresh fades, and fast tire service — see what&apos;s open near you in Berea.
            </p>
          </div>
          <Link href="/us/kentucky/berea" className="btn btn-primary shrink-0">
            <Icon name="location-dot" /> Explore Berea
          </Link>
        </div>
      </section>

      {/* ===== ADVERTISER CTA ===== */}
      <section className="container-shell pb-20">
        <div className="sign-plate flex flex-col items-center gap-6 px-6 py-12 text-center sm:px-12">
          <span className="pin-badge h-16 w-16">
            <Icon name="bullhorn" className="text-2xl" />
          </span>
          <h2 className="stamp text-3xl text-cream sm:text-4xl">OWN A LOCAL BUSINESS?</h2>
          <p className="max-w-xl text-cream/85">
            Get found by customers in your city and around the world. Advertise for
            just <strong className="text-gold">$19.99/month</strong> or{" "}
            <strong className="text-gold">$100/year</strong> — photos, hours, menu,
            reviews, coupons, and local search placement included.
          </p>
          <Link href="/advertise" className="btn btn-gold">
            <Icon name="arrow-right" /> Advertise your business
          </Link>
        </div>
      </section>
    </>
  );
}
