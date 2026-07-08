import { brand, siteUrl, SCHEMA_TYPE_BY_CATEGORY } from "./brand";
import type { BusinessFull } from "./queries";
import type { BusinessHour, Review } from "./db-types";

export function absoluteUrl(path: string): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function hubPath(
  countrySlug: string,
  stateSlug?: string,
  citySlug?: string,
  categorySlug?: string,
): string {
  return (
    "/" +
    [countrySlug, stateSlug, citySlug, categorySlug].filter(Boolean).join("/")
  );
}

export function businessPath(b: BusinessFull): string {
  const c = b.city?.state?.country?.slug;
  const s = b.city?.state?.slug;
  const ci = b.city?.slug;
  const cat = b.category?.slug;
  if (!c || !s || !ci || !cat) return `/business/${b.slug}`;
  return `/${c}/${s}/${ci}/${cat}/${b.slug}`;
}

function openingHours(hours: BusinessHour[]) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return hours
    .filter((h) => !h.is_closed && h.open_time && h.close_time)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days[h.day_of_week],
      opens: (h.open_time ?? "").slice(0, 5),
      closes: (h.close_time ?? "").slice(0, 5),
    }));
}

/**
 * LocalBusiness JSON-LD. Returns null for DEMO listings — never emit structured
 * data for a business that doesn't really exist (Fable P1 / Google spam policy).
 */
export function localBusinessJsonLd(
  b: BusinessFull,
  hours: BusinessHour[],
  reviews: Review[],
): Record<string, unknown> | null {
  if (b.is_demo) return null;
  const type = b.category
    ? SCHEMA_TYPE_BY_CATEGORY[b.category.slug]
    : "LocalBusiness";
  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type ?? "LocalBusiness",
    name: b.name,
    url: absoluteUrl(businessPath(b)),
    description: b.description ?? b.tagline ?? undefined,
    telephone: b.phone ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: b.address_line1 ?? undefined,
      addressLocality: b.city?.name,
      addressRegion: b.city?.state?.code ?? b.city?.state?.name,
      postalCode: b.postal_code ?? undefined,
      addressCountry: b.city?.state?.country?.code,
    },
  };
  if (b.lat != null && b.lng != null) {
    json.geo = { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lng };
  }
  const oh = openingHours(hours);
  if (oh.length) json.openingHoursSpecification = oh;
  if (b.rating_count > 0 && reviews.length > 0) {
    json.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: b.rating_avg,
      reviewCount: b.rating_count,
    };
  }
  return json;
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.url),
    })),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: siteUrl,
    logo: absoluteUrl(brand.logo),
    slogan: brand.slogan,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
