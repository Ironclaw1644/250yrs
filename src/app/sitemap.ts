import type { MetadataRoute } from "next";
import { absoluteUrl, hubPath } from "@/lib/seo";
import { listCountries, listStates, listCities } from "@/lib/queries";

/**
 * Navigational + geo hubs only. Demo listings are `noindex` (Fable P1) and are
 * intentionally excluded; business + city+category hub URLs are added to the
 * sitemap once REAL (non-demo) listings exist and clear the eligibility gate.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/us"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/advertise"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/tv-spots"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/how-it-works"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/legal"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Content gate: with every country and US state seeded, only hubs that
  // actually contain cities (cities exist only where businesses listed) earn
  // a sitemap entry — no thin/empty geo pages advertised to crawlers.
  const countries = await listCountries();
  for (const c of countries) {
    const states = await listStates(c.id);
    const stateRoutes: MetadataRoute.Sitemap = [];
    for (const s of states) {
      const cities = await listCities(s.id);
      if (cities.length === 0) continue;
      stateRoutes.push({ url: absoluteUrl(hubPath(c.slug, s.slug)), lastModified: now, changeFrequency: "weekly", priority: 0.6 });
      for (const ci of cities) {
        stateRoutes.push({ url: absoluteUrl(hubPath(c.slug, s.slug, ci.slug)), lastModified: now, changeFrequency: "weekly", priority: 0.6 });
      }
    }
    if (stateRoutes.length > 0) {
      routes.push({ url: absoluteUrl(hubPath(c.slug)), lastModified: now, changeFrequency: "weekly", priority: 0.7 });
      routes.push(...stateRoutes);
    }
  }
  // /us is both a hardcoded core route and a geo hub — keep one entry.
  const seen = new Set<string>();
  return routes.filter((r) => !seen.has(r.url) && seen.add(r.url));
}
