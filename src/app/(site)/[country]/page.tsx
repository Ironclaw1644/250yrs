import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCountryBySlug, listStates } from "@/lib/queries";
import { hubPath, breadcrumbJsonLd } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";

type Params = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { country } = await params;
  const c = await getCountryBySlug(country);
  if (!c) return { title: "Not found" };
  return {
    title: `Local Businesses in ${c.name}`,
    description: `Find real local businesses across ${c.name} — food, hair, tires, markets, and more.`,
    alternates: { canonical: hubPath(c.slug) },
  };
}

export default async function CountryPage({ params }: Params) {
  const { country } = await params;
  const c = await getCountryBySlug(country);
  if (!c) notFound();
  const states = await listStates(c.id);

  return (
    <div className="container-shell py-8">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: c.name }]} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: c.name, url: hubPath(c.slug) },
        ])}
      />
      <header className="mb-8 mt-4">
        <p className="eyebrow">{c.name}</p>
        <h1 className="font-heading text-h1 text-navy">
          Local businesses in {c.name}
        </h1>
        <p className="mt-2 max-w-2xl text-stone">
          Pick a state to see cities, categories, and the local shops near you.
        </p>
      </header>
      {states.length === 0 ? (
        <EmptyState
          icon="location-dot"
          title="Nothing listed here yet"
          body="We're adding states and cities across the country. Own a business? Be the first in your area."
          ctaHref="/advertise"
          ctaLabel="Advertise your business"
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {states.map((s) => (
            <li key={s.id}>
              <Link
                href={hubPath(c.slug, s.slug)}
                className="card flex items-center justify-between p-4 font-heading font-semibold text-navy transition-colors hover:text-barn"
              >
                <span>{s.name}</span>
                <Icon name="chevron-right" className="text-gold" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
