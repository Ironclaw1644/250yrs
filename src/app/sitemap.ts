import type { MetadataRoute } from "next";

import { getProductSlugs } from "@/lib/store-queries";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const slugs = await getProductSlugs();

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/shop"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...slugs.map((slug) => ({
      url: absoluteUrl(`/shop/${slug}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
