import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCountryBySlug,
  getStateBySlug,
  getCityBySlug,
  getCategoryRowBySlug,
  listPublishedBusinesses,
  realListingCount,
} from "@/lib/queries";
import { CATEGORY_BY_SLUG } from "@/lib/brand";
import { hubPath, breadcrumbJsonLd, absoluteUrl } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { BusinessCard } from "@/components/BusinessCard";
import { EmptyState } from "@/components/EmptyState";

type Params = {
  params: Promise<{
    country: string;
    state: string;
    city: string;
    category: string;
  }>;
};

async function resolve(p: {
  country: string;
  state: string;
  city: string;
  category: string;
}) {
  const c = await getCountryBySlug(p.country);
  const s = c ? await getStateBySlug(c.id, p.state) : null;
  const ci = s ? await getCityBySlug(s.id, p.city) : null;
  const cat = await getCategoryRowBySlug(p.category);
  return { c, s, ci, cat };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await params;
  const { c, s, ci, cat } = await resolve(p);
  if (!c || !s || !ci || !cat) return { title: "Not found" };
  const region = s.code ?? s.name;
  const list = await listPublishedBusinesses(ci.id, cat.id);
  const realCount = await realListingCount(ci.id, cat.id);
  const n = list.length;
  return {
    // index only when >=3 REAL (non-demo) listings support the page (Fable P1)
    robots: realCount >= 3 ? undefined : { index: false, follow: true },
    title: `${cat.name} in ${ci.name}, ${region}`,
    description: `Find ${n > 0 ? n + " " : ""}${cat.name.toLowerCase()} in ${ci.name}, ${region}. See hours, prices, photos, reviews, and directions — call, order, or book now.`,
    alternates: { canonical: hubPath(c.slug, s.slug, ci.slug, cat.slug) },
  };
}

export default async function CategoryHubPage({ params }: Params) {
  const p = await params;
  const { c, s, ci, cat } = await resolve(p);
  if (!c || !s || !ci || !cat) notFound();

  const businesses = await listPublishedBusinesses(ci.id, cat.id);
  const region = s.code ?? s.name;
  const brandCat = CATEGORY_BY_SLUG[cat.slug];
  const avg =
    businesses.filter((b) => b.rating_count > 0).length > 0
      ? (
          businesses
            .filter((b) => b.rating_count > 0)
            .reduce((a, b) => a + b.rating_avg, 0) /
          businesses.filter((b) => b.rating_count > 0).length
        ).toFixed(1)
      : null;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: businesses.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      url: absoluteUrl(hubPath(c.slug, s.slug, ci.slug, cat.slug) + "/" + b.slug),
    })),
  };

  return (
    <div className="container-shell py-8">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: c.name, href: hubPath(c.slug) },
          { name: s.name, href: hubPath(c.slug, s.slug) },
          { name: ci.name, href: hubPath(c.slug, s.slug, ci.slug) },
          { name: cat.name },
        ]}
      />
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: c.name, url: hubPath(c.slug) },
            { name: s.name, url: hubPath(c.slug, s.slug) },
            { name: ci.name, url: hubPath(c.slug, s.slug, ci.slug) },
            { name: cat.name, url: hubPath(c.slug, s.slug, ci.slug, cat.slug) },
          ]),
          businesses.length ? itemList : null,
        ]}
      />
      <header className="mb-8 mt-4">
        <p className="eyebrow">
          {ci.name}, {region}
        </p>
        <h1 className="font-heading text-h1 text-navy">
          {cat.name} in {ci.name}
        </h1>
        <p className="mt-2 max-w-2xl text-stone">
          {businesses.length > 0
            ? `${businesses.length} local ${cat.name.toLowerCase()} in ${ci.name}${
                avg ? `, averaging ${avg}★` : ""
              }. ${brandCat?.blurb ?? ""}.`
            : brandCat?.blurb ?? ""}
        </p>
      </header>

      {businesses.length === 0 ? (
        <EmptyState
          icon={brandCat?.icon ?? "store"}
          title={`No ${cat.name.toLowerCase()} listed in ${ci.name} yet`}
          body="Own one? Get listed so customers can find, call, and order from you."
          ctaHref="/advertise"
          ctaLabel="Advertise your business"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => (
            <BusinessCard
              key={b.id}
              business={b}
              categorySlug={cat.slug}
              href={hubPath(c.slug, s.slug, ci.slug, cat.slug) + "/" + b.slug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
