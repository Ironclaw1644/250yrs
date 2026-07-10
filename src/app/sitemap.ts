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

  const countries = await listCountries();
  for (const c of countries) {
    routes.push({ url: absoluteUrl(hubPath(c.slug)), lastModified: now, changeFrequency: "weekly", priority: 0.7 });
    const states = await listStates(c.id);
    for (const s of states) {
      routes.push({ url: absoluteUrl(hubPath(c.slug, s.slug)), lastModified: now, changeFrequency: "weekly", priority: 0.6 });
      const cities = await listCities(s.id);
      for (const ci of cities) {
        routes.push({ url: absoluteUrl(hubPath(c.slug, s.slug, ci.slug)), lastModified: now, changeFrequency: "weekly", priority: 0.6 });
      }
    }
  }
  return routes;
}
