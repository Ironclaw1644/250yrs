import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AnnouncementBar } from "@/components/announcement-bar";
import { FoundersIntakeForm } from "@/components/founders-intake-form";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { ShopGrid, type ShopGridItem } from "@/components/shop-grid";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { brand } from "@/lib/brand";
import { campaignGallery, campaignImages } from "@/lib/campaign-images";
import { getActiveProducts, getAllCopy } from "@/lib/store-queries";
import { primaryImage } from "@/lib/store-types";
import { absoluteUrl, defaultOgImage, siteName } from "@/lib/seo";

export const revalidate = 60;

const homepageTitle = "True American Wear | 250th Year Collection";
const homepageDescription =
  "Shop premium patriotic apparel from True American Wear, including heritage-inspired shirts, crewnecks, hoodies, and bundle sets celebrating America's 250th anniversary.";

export const metadata: Metadata = {
  title: { absolute: homepageTitle },
  description: homepageDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: homepageTitle,
    description: homepageDescription,
    url: "/",
    siteName,
    locale: "en_US",
    type: "website",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: homepageTitle,
    description: homepageDescription,
    images: [defaultOgImage.url],
  },
};

function copyOf(copy: Record<string, string>, key: string, fallback: string): string {
  const raw = copy[key];
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" && parsed.trim() ? parsed : fallback;
  } catch {
    return raw.trim() ? raw : fallback;
  }
}

export default async function Home() {
  const [products, copy] = await Promise.all([getActiveProducts(), getAllCopy()]);
  const featured = products.filter((p) => p.featured && p.category?.slug !== "sets").slice(0, 3);
  const sets = products.filter((p) => p.category?.slug === "sets");
  const toItem = (list: typeof products): ShopGridItem[] =>
    list.map((p) => {
      const img = primaryImage(p);
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle,
        description: p.description,
        badge: p.badge,
        priceCents: p.price_cents,
        imageUrl: img?.public_url ?? null,
        imageAlt: img?.alt ?? p.name,
        kind: p.category?.slug === "sets" ? "sets" : "garments",
        soldOut: p.status === "sold",
      };
    });

  const heroTitle = copyOf(copy, "copy.home.hero.title", "Wear the 250th.");
  const heroSubtitle = copyOf(
    copy,
    "copy.home.hero.subtitle",
    "Limited numbered releases built for America's 250th year — heavyweight fabrics, heritage graphics, and sets made to last well beyond it.",
  );
  const trust = [
    copyOf(copy, "copy.home.trust.1", "Limited numbered releases"),
    copyOf(copy, "copy.home.trust.2", "10-year warranty on sets"),
    copyOf(copy, "copy.home.trust.3", "Free US shipping over $125"),
  ];

  const campaignSpotlight = campaignGallery[0];
  const campaignCards = campaignGallery.slice(1);

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${siteName} Homepage`,
    url: absoluteUrl("/"),
    description: homepageDescription,
    isPartOf: { "@type": "WebSite", name: siteName, url: absoluteUrl("/") },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <AnnouncementBar />
      <SiteHeader />
      <main className="pb-20">
        {/* ===== Full-bleed campaign hero ===== */}
        <section className="relative min-h-[82vh] w-full overflow-hidden">
          <Image
            src={campaignImages.heroHoodie}
            alt="Liberty Eagle Hoodie campaign hero"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-obsidian via-brand-obsidian/45 to-brand-obsidian/10" />
          <div className="container-shell relative flex min-h-[82vh] flex-col items-start justify-end pb-16 pt-24">
            <p className="eyebrow">250th Year Collection · 1776–2026</p>
            <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[1.02] text-brand-cream sm:text-7xl">
              {heroTitle}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
              {heroSubtitle}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/shop" className="button-primary">
                Shop the collection
              </Link>
              <Link href="#founders-intake" className="button-secondary">
                Join the list
              </Link>
            </div>
          </div>
        </section>

        {/* ===== Trust strip ===== */}
        <section className="border-y border-white/6 bg-white/[0.03]">
          <div className="container-shell grid gap-3 py-5 sm:grid-cols-3">
            {trust.map((t) => (
              <p
                key={t}
                className="text-center text-xs uppercase tracking-[0.22em] text-brand-gold/80"
              >
                {t}
              </p>
            ))}
          </div>
        </section>

        {/* ===== Featured collection ===== */}
        <section id="collection" className="container-shell pt-14">
          <Reveal>
            <div className="section-shell space-y-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <SectionHeading
                  eyebrow="Featured pieces"
                  title="The core of the collection."
                  description="Start with the pieces that define the 250th year."
                />
                <Link href="/shop" className="button-secondary shrink-0">
                  View everything
                </Link>
              </div>
              <ShopGrid items={toItem(featured)} />
            </div>
          </Reveal>
        </section>

        {/* ===== Editorial band ===== */}
        <section className="container-shell pt-14">
          <Reveal>
            <div className="section-shell grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.8rem] border border-white/8">
                <Image
                  src={campaignImages.heroCouple}
                  alt="Couple wearing the Founders 1776 Crewneck and Redline 250 Shirt"
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="space-y-5">
                <div className="relative h-24 w-24">
                  <Image
                    src="/true-american-wear/logo.png"
                    alt="True American Wear crest"
                    fill
                    className="object-contain"
                  />
                </div>
                <h2 className="font-display text-4xl leading-tight text-brand-cream">
                  {brand.name}
                </h2>
                <p className="max-w-md leading-7 text-white/70">
                  Two hundred fifty years deserves more than a t-shirt. It deserves weight —
                  heavyweight fleece, structured collars, numbered releases, and graphics
                  that carry the year with presence. This is American heritage, built to wear.
                </p>
                <Link href="/shop" className="button-primary inline-flex">
                  Explore the collection
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ===== Sets showcase ===== */}
        {sets.length > 0 && (
          <section className="container-shell pt-14">
            <Reveal>
              <div className="section-shell space-y-8">
                <SectionHeading
                  eyebrow="Bundle sets"
                  title="Complete the set."
                  description="Numbered sets pairing core pieces for the full 250th year look — free shipping on every set."
                />
                <ShopGrid items={toItem(sets)} />
              </div>
            </Reveal>
          </section>
        )}

        {/* ===== Campaign gallery ===== */}
        <section id="campaign" className="container-shell pt-14">
          <Reveal>
            <div className="section-shell space-y-8">
              <SectionHeading
                eyebrow="The campaign"
                title="Shot like heritage. Worn like it, too."
                description="From main-street mornings to golden-hour rides — the collection in the world it was made for."
              />
              {campaignSpotlight && (
                <div className="relative min-h-[380px] overflow-hidden rounded-[1.8rem] border border-white/8 sm:min-h-[460px]">
                  <Image
                    src={campaignSpotlight.image}
                    alt={campaignSpotlight.title}
                    fill
                    sizes="(min-width: 1280px) 76rem, calc(100vw - 3rem)"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-obsidian/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 max-w-xl p-6">
                    <p className="font-display text-3xl text-brand-cream">
                      {campaignSpotlight.title}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid gap-5 sm:grid-cols-3">
                {campaignCards.slice(0, 3).map((card) => (
                  <div
                    key={card.image}
                    className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] border border-white/8"
                  >
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ===== Waitlist band ===== */}
        <section id="founders-intake" className="container-shell pt-14">
          <Reveal>
            <FoundersIntakeForm
              title="Join the founders list"
              description="First notice on drops, restocks, and numbered sets — plus 10% off your first order."
            />
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
