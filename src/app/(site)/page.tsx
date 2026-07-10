import { HomeHero } from "@/components/HomeHero";
import { CategoryTicker } from "@/components/CategoryTicker";
import { CategoryCircle } from "@/components/CategoryCircle";
import { FeaturedBusinesses } from "@/components/FeaturedBusinesses";
import { AdvertisePanel } from "@/components/AdvertisePanel";
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

      {/* Circular photo category row */}
      <section className="paper-grain border-b border-navy/10">
        <div className="container-shell py-10">
          <div className="flex gap-4 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center sm:overflow-visible">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.slug} delayMs={(i % 7) * 60}>
                <CategoryCircle category={c} href={`/categories/${c.slug}`} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Reveal>
        <FeaturedBusinesses />
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
