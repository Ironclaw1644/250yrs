import type { Metadata } from "next";
import { searchBusinesses } from "@/lib/queries";
import { businessPath } from "@/lib/seo";
import { BusinessCard } from "@/components/BusinessCard";
import { SearchBar } from "@/components/SearchBar";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchBusinesses(query) : [];

  return (
    <div className="container-shell py-8">
      <p className="eyebrow">Search</p>
      <h1 className="font-heading text-h1 text-navy">Find a local business</h1>
      <div className="mt-4 max-w-2xl">
        <SearchBar size="lg" />
      </div>

      {query && (
        <p className="mt-6 text-stone">
          {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((b) => (
            <BusinessCard
              key={b.id}
              business={b}
              categorySlug={b.category?.slug ?? "local-shops"}
              href={businessPath(b)}
            />
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon="magnifying-glass"
            title="No matches"
            body="Try a different name, category, or a nearby city."
            ctaHref="/us"
            ctaLabel="Browse the USA"
          />
        </div>
      )}
    </div>
  );
}
