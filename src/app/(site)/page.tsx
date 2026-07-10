import { HomeHero } from "@/components/HomeHero";
import { CategoryTicker } from "@/components/CategoryTicker";
import { CategoryCircle } from "@/components/CategoryCircle";
import { FeaturedBusinesses } from "@/components/FeaturedBusinesses";
import { AdvertisePanel } from "@/components/AdvertisePanel";
import { TvSpotsShowcase } from "@/components/TvSpotsShowcase";
import { TrustBar } from "@/components/TrustBar";
import { Reveal } from "@/components/Reveal";
import { CATEGORIES } from "@/lib/brand";
import { getGeoTree } from "@/lib/queries";

export default async function HomePage() {
  const geo = await getGeoTree();

  return (
    <>
      <HomeHero geo={geo} />

      <CategoryTicker />

      {/* Circular photo category row — one horizontal swipe strip on mobile.
          overflow-y-hidden is load-bearing: overflow-x-auto alone computes
          overflow-y to auto, which turned this into a vertical scroll box
          that clipped the circle tops. */}
      <section className="paper-grain border-b border-navy/10">
        <Reveal className="container-shell py-10">
          <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden pb-2 pt-3 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pt-0">
            {CATEGORIES.map((c) => (
              <div key={c.slug} className="shrink-0 snap-start">
                <CategoryCircle category={c} href={`/categories/${c.slug}`} />
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <Reveal>
        <FeaturedBusinesses />
      </Reveal>

      <Reveal>
        <TvSpotsShowcase />
      </Reveal>

      <Reveal>
        <AdvertisePanel />
      </Reveal>

      <Reveal>
        <TrustBar />
      </Reveal>
    </>
  );
}
