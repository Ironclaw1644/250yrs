import Link from "next/link";
import { BusinessCard } from "./BusinessCard";
import { Icon } from "./Icon";
import { businessPath } from "@/lib/seo";
import { listFeaturedBusinesses, primaryPhoto } from "@/lib/queries";

export async function FeaturedBusinesses() {
  const businesses = await listFeaturedBusinesses(8);
  if (!businesses.length) return null;

  return (
    <section className="container-shell py-14 sm:py-20">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="eyebrow">Featured Businesses</p>
          <h2 className="mt-1 font-heading text-h1 text-navy">
            Local favorites near you
          </h2>
        </div>
        <Link
          href="/us"
          className="hidden items-center gap-1 font-sans font-bold text-barn hover:underline sm:inline-flex"
        >
          View All <Icon name="arrow-right" />
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {businesses.map((b, i) => {
          const photo = primaryPhoto(b);
          const region = b.city?.state?.code ?? b.city?.state?.name ?? "";
          return (
            <div key={b.id} className="reveal" style={{ "--i": i } as React.CSSProperties}>
              <BusinessCard
                business={b}
                categorySlug={b.category?.slug ?? "local-shops"}
                href={businessPath(b)}
                photoUrl={photo?.url}
                photoAlt={photo?.alt}
                cityLabel={b.city ? `${b.city.name}, ${region}` : undefined}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
