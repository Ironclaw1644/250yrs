import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getCountryBySlug,
  getStateBySlug,
  listCities,
} from "@/lib/queries";
import { hubPath, breadcrumbJsonLd } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";

type Params = { params: Promise<{ country: string; state: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { country, state } = await params;
  const c = await getCountryBySlug(country);
  const s = c ? await getStateBySlug(c.id, state) : null;
  if (!c || !s) return { title: "Not found" };
  return {
    title: `Local Businesses in ${s.name}`,
    description: `Cities and local businesses across ${s.name} — food, hair, tires, markets, and more.`,
    alternates: { canonical: hubPath(c.slug, s.slug) },
  };
}

export default async function StatePage({ params }: Params) {
  const { country, state } = await params;
  const c = await getCountryBySlug(country);
  const s = c ? await getStateBySlug(c.id, state) : null;
  if (!c || !s) notFound();
  const cities = await listCities(s.id);

  return (
    <div className="container-shell py-8">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: c.name, href: hubPath(c.slug) },
          { name: s.name },
        ]}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: c.name, url: hubPath(c.slug) },
          { name: s.name, url: hubPath(c.slug, s.slug) },
        ])}
      />
      <header className="mb-8 mt-4">
        <p className="eyebrow">{c.name}</p>
        <h1 className="font-heading text-h1 text-navy">
          Local businesses in {s.name}
        </h1>
        <p className="mt-2 max-w-2xl text-stone">Choose a city to explore.</p>
      </header>
      {cities.length === 0 ? (
        <EmptyState
          title="No cities listed yet"
          body={`We're building out ${s.name}. Own a business here? Get listed and be found.`}
          ctaHref="/advertise"
          ctaLabel="Advertise your business"
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cities.map((ci) => (
            <li key={ci.id}>
              <Link
                href={hubPath(c.slug, s.slug, ci.slug)}
                className="card flex items-center justify-between p-4 font-heading font-semibold text-navy transition-colors hover:text-barn"
              >
                <span>{ci.name}</span>
                <Icon name="chevron-right" className="text-gold" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
