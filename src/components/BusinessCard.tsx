import Link from "next/link";
import { Icon } from "./Icon";
import { Stars } from "./Stars";
import { CATEGORY_BY_SLUG } from "@/lib/brand";
import type { Business } from "@/lib/db-types";

export function BusinessCard({
  business,
  href,
  categorySlug,
}: {
  business: Business;
  href: string;
  categorySlug: string;
}) {
  const cat = CATEGORY_BY_SLUG[categorySlug];
  return (
    <Link href={href} className="card group block overflow-hidden">
      <div className="relative flex aspect-[16/10] items-center justify-center bg-sign-navy">
        <Icon name={cat?.icon ?? "store"} className="text-5xl text-gold/85" />
        {business.featured_city && (
          <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-0.5 font-heading text-xs font-semibold uppercase tracking-wide text-navy-deep">
            Featured
          </span>
        )}
        {business.is_demo && (
          <span className="demo-ribbon absolute right-3 top-3">Demo</span>
        )}
      </div>
      <div className="p-4">
        <p className="eyebrow mb-1">{cat?.name}</p>
        <h3 className="font-heading text-h3 leading-tight text-navy transition-colors group-hover:text-barn">
          {business.name}
        </h3>
        {business.tagline && (
          <p className="mt-1 line-clamp-2 text-small text-stone">
            {business.tagline}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          {business.rating_count > 0 ? (
            <Stars rating={business.rating_avg} count={business.rating_count} />
          ) : (
            <span className="text-small text-stone">New listing</span>
          )}
          {business.address_line1 && (
            <span className="inline-flex items-center gap-1 text-small text-stone">
              <Icon name="location-dot" className="text-gold" />
              {business.address_line1}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
