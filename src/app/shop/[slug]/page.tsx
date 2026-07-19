import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BuyBox } from "@/components/buy-box";
import { FoundersIntakeForm } from "@/components/founders-intake-form";
import { LightboxImage } from "@/components/lightbox-image";
import { ProductRail } from "@/components/product-rail";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { brand } from "@/lib/brand";
import { getActiveProducts, getProductBySlug, getProductSlugs } from "@/lib/store-queries";
import { formatCents } from "@/lib/store-config";
import { primaryImage } from "@/lib/store-types";
import { absoluteUrl, buildTitle } from "@/lib/seo";

export const revalidate = 60;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: buildTitle("Product") };

  const path = `/shop/${product.slug}`;
  const title = product.seo_title ?? product.name;
  const description = product.seo_description ?? product.description ?? product.subtitle ?? "";
  const og = primaryImage(product);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: buildTitle(title),
      description,
      url: path,
      siteName: brand.name,
      locale: "en_US",
      type: "website",
      images: og ? [{ url: og.public_url, alt: og.alt ?? product.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: buildTitle(title),
      description,
      images: og ? [og.public_url] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, all] = await Promise.all([getProductBySlug(slug), getActiveProducts()]);
  if (!product) notFound();

  const gallery = product.images;
  const description = product.seo_description ?? product.description ?? "";
  const isSet = product.category?.slug === "sets";
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image: gallery.map((image) => absoluteUrl(image.public_url)),
    sku: product.sku,
    brand: { "@type": "Brand", name: brand.name },
    offers: {
      "@type": "Offer",
      price: (product.price_cents / 100).toString(),
      priceCurrency: "USD",
      availability:
        product.status === "sold"
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
      url: absoluteUrl(`/shop/${product.slug}`),
    },
  };

  const related = all
    .filter((p) => p.id !== product.id)
    .sort((a, b) => {
      const sameA = a.category_id === product.category_id ? 0 : 1;
      const sameB = b.category_id === product.category_id ? 0 : 1;
      return sameA - sameB || a.sort_order - b.sort_order;
    })
    .slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <SiteHeader />
      <main className="pb-20 pt-10">
        <section className="container-shell">
          <div className="section-shell grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-5">
              {gallery[0] && (
                <LightboxImage
                  src={gallery[0].public_url}
                  alt={gallery[0].alt ?? product.name}
                  priority
                  containerClassName="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-brand-gold/15 bg-black/30 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
                  imageClassName="object-cover"
                />
              )}
              {gallery.length > 1 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  {gallery.slice(1).map((image) => (
                    <LightboxImage
                      key={image.id}
                      src={image.public_url}
                      alt={image.alt ?? product.name}
                      containerClassName="relative aspect-square overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/5"
                      imageClassName="object-cover"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Sticky purchase column on desktop */}
            <div className="space-y-8 lg:sticky lg:top-24 lg:self-start">
              <div className="space-y-4">
                <Link
                  href="/shop"
                  className="text-xs uppercase tracking-[0.22em] text-brand-gold/72 transition hover:text-brand-cream"
                >
                  Back to shop
                </Link>
                {product.badge && <p className="eyebrow">{product.badge}</p>}
                <h1 className="font-display text-5xl leading-none text-brand-cream sm:text-6xl">
                  {product.name}
                </h1>
                {product.subtitle && (
                  <p className="text-xl text-white/74">{product.subtitle}</p>
                )}
                <p className="sr-only">{formatCents(product.price_cents)}</p>
                {product.description && (
                  <p className="max-w-xl text-base leading-7 text-white/72">
                    {product.description}
                  </p>
                )}
                {isSet && (
                  <p className="text-sm text-brand-gold/80">
                    Complete set — pick your sizes below.
                  </p>
                )}
              </div>

              <BuyBox product={product} />
            </div>
          </div>

          {/* Materials / details / release */}
          {(product.materials.length > 0 || product.details.length > 0 || product.release_note) && (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {product.materials.length > 0 && (
                <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-gold/70">Materials</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-white/72">
                    {product.materials.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {product.details.length > 0 && (
                <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-gold/70">Details</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-white/72">
                    {product.details.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {product.release_note && (
                <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-gold/70">Release</p>
                  <p className="mt-3 text-sm leading-6 text-white/72">{product.release_note}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-10">
            <FoundersIntakeForm
              productName={product.name}
              title="First notice on restocks"
              description="Join the list and we'll email you when this piece restocks or a new colorway drops."
            />
          </div>

          {related.length > 0 && <ProductRail products={related} />}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
