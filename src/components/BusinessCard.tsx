import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icon";
import { Stars } from "./Stars";
import { CATEGORY_BY_SLUG } from "@/lib/brand";
import type { Business } from "@/lib/db-types";

export function BusinessCard({
  business,
  href,
  categorySlug,
  photoUrl,
  photoAlt,
  cityLabel,
}: {
  business: Business;
  href: string;
  categorySlug: string;
  photoUrl?: string | null;
  photoAlt?: string | null;
  cityLabel?: string;
}) {
  const cat = CATEGORY_BY_SLUG[categorySlug];
  return (
    <Link href={href} className="card group block overflow-hidden">
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-sign-navy">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={photoAlt ?? business.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-entrance ease-warm group-hover:scale-[1.03]"
          />
        ) : (
          <Icon name={cat?.icon ?? "store"} className="text-5xl text-gold/85" />
        )}
        {business.featured_city && (
          <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-0.5 font-sans text-xs font-bold text-navy-deep shadow-card">
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
        <div className="mt-2 flex items-center gap-2 text-small text-stone">
          {business.rating_count > 0 ? (
            <Stars rating={business.rating_avg} count={business.rating_count} />
          ) : (
            <span>New listing</span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-navy/10 pt-3">
          <span className="inline-flex items-center gap-1 text-small text-stone">
            <Icon name="location-dot" className="text-gold" />
            {cityLabel ?? business.address_line1 ?? "Local"}
          </span>
          <span className="inline-flex items-center gap-1 font-sans text-small font-bold text-barn">
            View Details <Icon name="arrow-right" />
          </span>
        </div>
      </div>
    </Link>
  );
}
