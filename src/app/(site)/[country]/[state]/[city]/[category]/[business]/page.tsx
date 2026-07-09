import Image from "next/image";
import { notFound } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import {
  getBusinessBySlugFull,
  getHours,
  getMenu,
  getPhotos,
  getVisibleReviews,
} from "@/lib/queries";
import { CATEGORY_BY_SLUG } from "@/lib/brand";
import {
  businessPath,
  hubPath,
  breadcrumbJsonLd,
  localBusinessJsonLd,
} from "@/lib/seo";
import { computeOpenNow } from "@/lib/format";
import { getSessionUser } from "@/lib/auth";
import { trackImpression } from "@/lib/track";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Stars } from "@/components/Stars";
import { HoursTable } from "@/components/HoursTable";
import { MenuList } from "@/components/MenuList";
import { ActionBar } from "@/components/ActionBar";
import { PhotoGallery } from "@/components/PhotoGallery";
import { ReviewForm } from "@/components/ReviewForm";
import { OwnerResponseForm } from "@/components/OwnerResponseForm";
import { Icon } from "@/components/Icon";

type Params = {
  params: Promise<{
    country: string;
    state: string;
    city: string;
    category: string;
    business: string;
  }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { business } = await params;
  const b = await getBusinessBySlugFull(business);
  if (!b) return { title: "Not found" };
  const region = b.city?.state?.code ?? b.city?.state?.name ?? "";
  const cat = b.category?.name ?? "Local Business";
  return {
    // demo listings are never indexed (Fable P1)
    robots: b.is_demo ? { index: false, follow: true } : undefined,
    title: `${b.name} — ${cat} in ${b.city?.name}, ${region}`,
    description: (
      b.description ??
      b.tagline ??
      `${b.name}, a ${cat.toLowerCase()} in ${b.city?.name}, ${region}.`
    ).slice(0, 155),
    alternates: { canonical: businessPath(b) },
  };
}

export default async function BusinessPage({ params }: Params) {
  const { business } = await params;
  const b = await getBusinessBySlugFull(business);
  if (!b) notFound();

  const [hours, menu, reviews, photos, viewer] = await Promise.all([
    getHours(b.id),
    getMenu(b.id),
    getVisibleReviews(b.id),
    getPhotos(b.id),
    getSessionUser(),
  ]);

  // Non-blocking impression tracking (real listings only)
  if (!b.is_demo) {
    after(() => trackImpression(b.id, "business_page", b.city_id));
  }

  const open = computeOpenNow(hours);
  const city = b.city;
  const state = city?.state;
  const country = state?.country;
  const cat = b.category;
  const brandCat = cat ? CATEGORY_BY_SLUG[cat.slug] : undefined;
  const region = state?.code ?? state?.name ?? "";
  const heroPhoto =
    photos.find((p) => p.is_primary) ??
    [...photos].sort((a, z) => a.sort_order - z.sort_order)[0];
  const isOwner = Boolean(viewer && b.owner_id && viewer.id === b.owner_id);

  const crumbData = [
    { name: "Home", url: "/" },
    ...(country ? [{ name: country.name, url: hubPath(country.slug) }] : []),
    ...(country && state
      ? [{ name: state.name, url: hubPath(country.slug, state.slug) }]
      : []),
    ...(country && state && city
      ? [{ name: city.name, url: hubPath(country.slug, state.slug, city.slug) }]
      : []),
    ...(country && state && city && cat
      ? [
          {
            name: cat.name,
            url: hubPath(country.slug, state.slug, city.slug, cat.slug),
          },
        ]
      : []),
    { name: b.name, url: businessPath(b) },
  ];
  const crumbs: Crumb[] = crumbData.map((c, i) => ({
    name: c.name,
    href: i === crumbData.length - 1 ? undefined : c.url,
  }));

  return (
    <div className="container-shell py-8">
      <Breadcrumbs items={crumbs} />
      <JsonLd data={[breadcrumbJsonLd(crumbData), localBusinessJsonLd(b, hours, reviews)]} />

      {/* Hero banner — primary photo background when available */}
      <div className="relative mt-4 overflow-hidden rounded-2xl bg-sign-navy px-6 py-8 shadow-raised sm:px-10 sm:py-12">
        {heroPhoto && (
          <>
            <Image
              src={heroPhoto.url}
              alt={heroPhoto.alt_text ?? b.name}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/95 via-navy-deep/60 to-navy/30" />
          </>
        )}
        {!heroPhoto && (
          <Icon
            name={brandCat?.icon ?? "store"}
            className="pointer-events-none absolute -right-4 -top-6 text-[9rem] text-gold/10"
          />
        )}
        <div className="relative">
          <p className="font-heading text-eyebrow font-semibold uppercase tracking-widest text-gold">
            {cat?.name}
            {city ? ` · ${city.name}, ${region}` : ""}
          </p>
          <h1 className="mt-2 font-heading text-4xl font-bold text-cream drop-shadow sm:text-5xl">
            {b.name}
          </h1>
          {b.tagline && <p className="mt-2 max-w-2xl text-cream/90">{b.tagline}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {b.rating_count > 0 && (
              <span className="text-cream">
                <Stars rating={b.rating_avg} count={b.rating_count} />
              </span>
            )}
            <span className={`pill ${open.open ? "pill-open" : "pill-closed"}`}>
              <Icon name="clock" /> {open.label}
            </span>
            {b.is_demo && <span className="demo-ribbon">Demo</span>}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6">
        <ActionBar
          businessId={b.id}
          name={b.name}
          phone={b.phone}
          lat={b.lat}
          lng={b.lng}
          address={[b.address_line1, city?.name, region].filter(Boolean).join(", ")}
          demo={b.is_demo}
        />
      </div>

      {b.is_demo && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border-2 border-gold/50 bg-gold/10 p-4">
          <Icon name="circle-info" className="mt-0.5 text-lg text-gold" />
          <p className="text-small text-char">
            <strong className="font-heading uppercase tracking-wide text-navy">
              Demo listing.
            </strong>{" "}
            This is a sample showing how a real business page looks on True
            American Where. It isn&apos;t a real business yet —{" "}
            <a href="/advertise" className="font-semibold text-barn underline">
              claim this spot for your shop
            </a>
            .
          </p>
        </div>
      )}

      {/* Photo gallery strip */}
      {photos.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-heading text-h2 text-navy">Photos</h2>
          <PhotoGallery
            photos={photos.map((p) => ({ url: p.url, alt_text: p.alt_text }))}
            name={b.name}
          />
        </section>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-10">
          {b.description && (
            <section>
              <h2 className="mb-3 font-heading text-h2 text-navy">
                About {b.name}
              </h2>
              <p className="max-w-prose text-char/90">{b.description}</p>
            </section>
          )}

          {menu.length > 0 && (
            <section>
              <h2 className="mb-4 font-heading text-h2 text-navy">Menu</h2>
              <div className="card p-6">
                <MenuList sections={menu} />
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 font-heading text-h2 text-navy">Reviews</h2>
            <div className="space-y-4">
              {!b.is_demo && <ReviewForm businessId={b.id} />}
              {reviews.length === 0 ? (
                <div className="card p-6 text-stone">
                  {b.is_demo
                    ? "Reviews appear here once this business is claimed and customers start visiting."
                    : "No reviews yet — be the first to leave one."}
                </div>
              ) : (
                <ul className="space-y-4">
                  {reviews.map((r) => (
                    <li key={r.id} className="card p-5">
                      <Stars rating={r.rating} showNumber={false} />
                      {r.body && <p className="mt-2 text-char/90">{r.body}</p>}
                      {r.response_body ? (
                        <div className="mt-3 rounded-md bg-linen/70 p-3 text-small">
                          <span className="font-heading font-semibold uppercase tracking-wide text-navy">
                            Owner response
                          </span>
                          <p className="mt-1 text-char/90">{r.response_body}</p>
                        </div>
                      ) : (
                        isOwner && <OwnerResponseForm reviewId={r.id} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-3 flex items-center gap-2 font-heading text-h3 text-navy">
              <Icon name="clock" className="text-gold" /> Hours
            </h2>
            {hours.length ? (
              <HoursTable hours={hours} />
            ) : (
              <p className="text-small text-stone">Hours not listed.</p>
            )}
          </div>

          <div className="card p-6">
            <h2 className="mb-3 flex items-center gap-2 font-heading text-h3 text-navy">
              <Icon name="location-dot" className="text-gold" /> Find it
            </h2>
            <address className="not-italic text-char/90">
              {b.address_line1 && <div>{b.address_line1}</div>}
              <div>
                {city?.name}
                {region ? `, ${region}` : ""} {b.postal_code ?? ""}
              </div>
              {b.phone && (
                <div className="mt-2">
                  <a href={`tel:${b.phone.replace(/[^0-9+]/g, "")}`} className="tabular text-navy hover:text-barn">
                    {b.phone}
                  </a>
                </div>
              )}
            </address>
          </div>
        </aside>
      </div>
    </div>
  );
}
