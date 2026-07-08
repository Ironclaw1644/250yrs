import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCountryBySlug,
  getStateBySlug,
  getCityBySlug,
  listCategoriesInCity,
  listAllCategories,
} from "@/lib/queries";
import { CATEGORY_BY_SLUG } from "@/lib/brand";
import { hubPath, breadcrumbJsonLd } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { CategoryTile } from "@/components/CategoryTile";
import { EmptyState } from "@/components/EmptyState";

type Params = {
  params: Promise<{ country: string; state: string; city: string }>;
};

async function resolve(country: string, state: string, city: string) {
  const c = await getCountryBySlug(country);
  const s = c ? await getStateBySlug(c.id, state) : null;
  const ci = s ? await getCityBySlug(s.id, city) : null;
  return { c, s, ci };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { country, state, city } = await params;
  const { c, s, ci } = await resolve(country, state, city);
  if (!c || !s || !ci) return { title: "Not found" };
  const region = s.code ?? s.name;
  return {
    title: `Local Businesses in ${ci.name}, ${region}`,
    description: `Find local businesses in ${ci.name}, ${region} — food, hair, tires, markets, bakeries, and more. Hours, photos, reviews, and directions.`,
    alternates: { canonical: hubPath(c.slug, s.slug, ci.slug) },
  };
}

export default async function CityPage({ params }: Params) {
  const { country, state, city } = await params;
  const { c, s, ci } = await resolve(country, state, city);
  if (!c || !s || !ci) notFound();

  const [counts, allCats] = await Promise.all([
    listCategoriesInCity(ci.id),
    listAllCategories(),
  ]);
  const slugById = new Map(allCats.map((k) => [k.id, k.slug]));
  const region = s.code ?? s.name;
  const present = counts
    .map((row) => ({ slug: slugById.get(row.category_id), count: row.count }))
    .filter((x): x is { slug: string; count: number } => Boolean(x.slug))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="container-shell py-8">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: c.name, href: hubPath(c.slug) },
          { name: s.name, href: hubPath(c.slug, s.slug) },
          { name: ci.name },
        ]}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: c.name, url: hubPath(c.slug) },
          { name: s.name, url: hubPath(c.slug, s.slug) },
          { name: ci.name, url: hubPath(c.slug, s.slug, ci.slug) },
        ])}
      />
      <header className="mb-8 mt-4">
        <p className="eyebrow">
          {ci.name}, {region}
        </p>
        <h1 className="font-heading text-h1 text-navy">
          Local businesses in {ci.name}
        </h1>
        <p className="mt-2 max-w-2xl text-stone">
          Browse categories below to find real local shops in {ci.name} — with
          hours, photos, prices, reviews, and directions.
        </p>
      </header>

      {present.length === 0 ? (
        <EmptyState
          title={`No listings in ${ci.name} yet`}
          body="Be the first business customers find here."
          ctaHref="/advertise"
          ctaLabel="Advertise your business"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {present.map(({ slug, count }) => {
            const cat = CATEGORY_BY_SLUG[slug];
            if (!cat) return null;
            return (
              <CategoryTile
                key={slug}
                category={cat}
                href={hubPath(c.slug, s.slug, ci.slug, slug)}
                count={count}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
