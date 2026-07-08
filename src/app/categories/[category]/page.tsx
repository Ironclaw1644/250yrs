import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCategoryRowBySlug, citiesForCategory } from "@/lib/queries";
import { CATEGORY_BY_SLUG } from "@/lib/brand";
import { hubPath, breadcrumbJsonLd } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";

type Params = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  const c = await getCategoryRowBySlug(category);
  if (!c) return { title: "Not found" };
  return {
    title: `${c.name} Near You`,
    description: `Find local ${c.name.toLowerCase()} across the U.S. and beyond — hours, photos, prices, reviews, and directions.`,
    alternates: { canonical: `/categories/${c.slug}` },
  };
}

export default async function CategoryLanding({ params }: Params) {
  const { category } = await params;
  const c = await getCategoryRowBySlug(category);
  if (!c) notFound();
  const cities = await citiesForCategory(c.id);
  const brandCat = CATEGORY_BY_SLUG[c.slug];

  return (
    <div className="container-shell py-8">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: c.name }]} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: c.name, url: `/categories/${c.slug}` },
        ])}
      />
      <header className="mb-8 mt-4 flex items-center gap-4">
        <span className="pin-badge h-16 w-16 shrink-0">
          <Icon name={brandCat?.icon ?? "store"} className="text-2xl" />
        </span>
        <div>
          <p className="eyebrow">Category</p>
          <h1 className="font-heading text-h1 text-navy">{c.name}</h1>
          <p className="mt-1 max-w-2xl text-stone">
            {brandCat?.blurb}. Pick a city to see local {c.name.toLowerCase()}.
          </p>
        </div>
      </header>

      {cities.length === 0 ? (
        <EmptyState
          icon={brandCat?.icon ?? "store"}
          title={`No ${c.name.toLowerCase()} listed yet`}
          body="Own one? Get listed and be the first customers find in your city."
          ctaHref="/advertise"
          ctaLabel="Advertise your business"
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map(({ city, state, country, count }) => (
            <li key={city.id}>
              <Link
                href={hubPath(country.slug, state.slug, city.slug, c.slug)}
                className="card flex items-center justify-between p-4"
              >
                <span>
                  <span className="font-heading font-semibold text-navy">
                    {city.name}, {state.code ?? state.name}
                  </span>
                  <span className="block text-small text-stone">
                    {count} {count === 1 ? "place" : "places"}
                  </span>
                </span>
                <Icon name="chevron-right" className="text-gold" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
