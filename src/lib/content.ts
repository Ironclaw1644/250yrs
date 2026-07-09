import "server-only";
import { unstable_cache } from "next/cache";
import { db, dbConfigured } from "./supabase";

/**
 * All editable site copy as a flat { key -> string } map.
 * Cached + tagged so public pages stay static; updateCopy() revalidates the
 * "site-content" tag on save.
 */
export const getAllCopy = unstable_cache(
  async (): Promise<Record<string, string>> => {
    if (!dbConfigured) return {};
    try {
      const { data } = await db().from("site_content").select("key,value");
      const map: Record<string, string> = {};
      for (const row of (data as { key: string; value: unknown }[]) ?? []) {
        map[row.key] =
          typeof row.value === "string" ? row.value : JSON.stringify(row.value);
      }
      return map;
    } catch {
      return {};
    }
  },
  ["site-content"],
  { tags: ["site-content"] },
);

/** One setting with fallback (site.* keys). */
export async function getSetting(key: string, fallback = ""): Promise<string> {
  const copy = await getAllCopy();
  return copy[key] ?? fallback;
}
