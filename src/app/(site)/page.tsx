import { HomeHero } from "@/components/HomeHero";
import { CategoryCircle } from "@/components/CategoryCircle";
import { FeaturedBusinesses } from "@/components/FeaturedBusinesses";
import { AdvertisePanel } from "@/components/AdvertisePanel";
import { TrustBar } from "@/components/TrustBar";
import { CATEGORIES } from "@/lib/brand";
import { getGeoTree } from "@/lib/queries";

export default async function HomePage() {
  const geo = await getGeoTree();

  return (
    <>
      <HomeHero geo={geo} />

      {/* Circular photo category row */}
      <section className="paper-grain border-b border-navy/10">
        <div className="container-shell py-10">
          <div className="flex gap-4 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center sm:overflow-visible">
            {CATEGORIES.map((c, i) => (
              <div key={c.slug} className="reveal" style={{ "--i": i } as React.CSSProperties}>
                <CategoryCircle category={c} href={`/categories/${c.slug}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <FeaturedBusinesses />

      <AdvertisePanel />

      <TrustBar />
    </>
  );
}
