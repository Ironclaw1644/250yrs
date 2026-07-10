import Image from "next/image";
import Link from "next/link";
import { Editable } from "./Editable";
import { HeroFinder } from "./HeroFinder";
import { CATEGORIES } from "@/lib/brand";
import type { GeoTree } from "@/lib/queries";

const POPULAR = [
  { label: "Fried Food", slug: "fried-food" },
  { label: "Hair Salon", slug: "hair-salons" },
  { label: "Barber Shop", slug: "barber-shops" },
  { label: "Tire Shop", slug: "tire-shops" },
  { label: "Fish Market", slug: "fish-markets" },
  { label: "Food Market", slug: "grocery-markets" },
];

export function HomeHero({ geo }: { geo: GeoTree }) {
  return (
    <section className="relative overflow-hidden bg-navy-deep">
      <Image
        src="/images/hero/hero-1.webp"
        alt="Small-town American main street at golden hour"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/70 via-navy/55 to-navy-deep/90" />

      <div className="container-shell relative py-16 sm:py-24">
        <div className="max-w-3xl">
          <h1 className="stamp reveal text-4xl leading-tight text-cream sm:text-6xl" style={{ "--i": 0 } as React.CSSProperties}>
            <Editable id="copy.home.hero.headline">Find the Real Local Stores</Editable>
          </h1>
          <p
            className="stamp reveal mt-3 text-2xl italic text-gold sm:text-3xl"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            <Editable id="copy.home.hero.subline">
              Food, Hair, Tires, Markets, and More.
            </Editable>
          </p>
          <p
            className="reveal mt-4 max-w-xl text-lead text-cloud/90"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <Editable id="copy.home.hero.support">
              Support local businesses in every city, every state, and around the world.
            </Editable>
          </p>
        </div>

        <div className="reveal mt-8" style={{ "--i": 3 } as React.CSSProperties}>
          <HeroFinder geo={geo} categories={CATEGORIES} />
        </div>

        <div
          className="reveal mt-5 flex flex-wrap items-center gap-2"
          style={{ "--i": 4 } as React.CSSProperties}
        >
          <span className="font-sans text-small font-bold text-cloud/80">
            Popular:
          </span>
          {POPULAR.map((p) => (
            <Link
              key={p.slug}
              href={`/categories/${p.slug}`}
              className="rounded-full border border-gold/50 bg-navy/60 px-3 py-1 text-small font-semibold text-cream transition-colors hover:bg-gold hover:text-navy-deep"
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
