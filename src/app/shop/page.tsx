import type { Metadata } from "next";
import Image from "next/image";

import { FoundersIntakeForm } from "@/components/founders-intake-form";
import { SectionHeading } from "@/components/section-heading";
import { ShopGrid, type ShopGridItem } from "@/components/shop-grid";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getActiveProducts } from "@/lib/store-queries";
import { primaryImage } from "@/lib/store-types";
import { absoluteUrl, createMetadata, siteName } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = createMetadata({
  title: "Shop Patriotic Shirts, Crewnecks & Hoodies",
  description:
    "Shop the True American Wear 250th Year Collection of patriotic shirts, crewnecks, hoodies, and bundle sets inspired by America's 250th anniversary.",
  path: "/shop",
});

export default async function ShopPage() {
  const products = await getActiveProducts();
  const items: ShopGridItem[] = products.map((p) => {
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

  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteName} Shop`,
    url: absoluteUrl("/shop"),
    description:
      "Shop the True American Wear 250th Year Collection of patriotic shirts, crewnecks, hoodies, and bundle sets inspired by America's 250th anniversary.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }}
      />
      <SiteHeader />
      <main className="pb-20 pt-10">
        <section className="container-shell">
          <div className="section-shell space-y-8">
            <SectionHeading
              as="h1"
              eyebrow="250th Year Collection"
              title="The 250th Year Collection starts here."
              description="Start with the Founders Crewneck, then build it out with the Eagle Hoodie and Redline Shirt."
            />

            <div className="relative min-h-[360px] overflow-hidden rounded-[1.8rem] border border-white/8 bg-black/30 sm:min-h-[420px]">
              <Image
                src="/true-american-wear/07-couple-shot-founders-1776-crewneck-and-liberty-eagle-hoodie.webp"
                alt="Couple wearing the Founders 1776 Crewneck and Liberty Eagle Hoodie"
                fill
                priority
                sizes="(min-width: 1280px) 76rem, (min-width: 640px) calc(100vw - 4rem), calc(100vw - 3rem)"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-obsidian via-brand-obsidian/10 to-transparent" />
              <div className="absolute bottom-0 left-0 max-w-2xl p-6">
                <p className="eyebrow">250th Year Collection</p>
                <h2 className="font-display text-4xl text-brand-cream">
                  Built for the 250th. Made to last well beyond it.
                </h2>
              </div>
            </div>

            <ShopGrid items={items} />

            <div id="early-access">
              <FoundersIntakeForm
                title="Early access to new drops"
                description="Join the list for first notice on new releases, restocks, and set drops."
              />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
