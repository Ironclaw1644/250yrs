import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "./supabase";
import type {
  Business,
  BusinessHour,
  BusinessPhoto,
  CategoryRow,
  City,
  Country,
  MenuItem,
  MenuSection,
  Review,
  State,
} from "./db-types";

/**
 * Wrap a query so infra failures degrade gracefully IN PRODUCTION only.
 * In dev we log loudly AND rethrow — silent empty-states previously hid a
 * schema-cache outage (PGRST205) behind 404s.
 */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("[taw query]", (e as Error)?.message);
    if (process.env.NODE_ENV !== "production") throw e;
    return fallback;
  }
}

export async function getCountryBySlug(slug: string): Promise<Country | null> {
  return safe(async () => {
    const { data } = await db()
      .from("countries")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    return (data as Country) ?? null;
  }, null);
}

export async function getStateBySlug(
  countryId: string,
  slug: string,
): Promise<State | null> {
  return safe(async () => {
    const { data } = await db()
      .from("states")
      .select("*")
      .eq("country_id", countryId)
      .eq("slug", slug)
      .maybeSingle();
    return (data as State) ?? null;
  }, null);
}

export async function getCityBySlug(
  stateId: string,
  slug: string,
): Promise<City | null> {
  return safe(async () => {
    const { data } = await db()
      .from("cities")
      .select("*")
      .eq("state_id", stateId)
      .eq("slug", slug)
      .maybeSingle();
    return (data as City) ?? null;
  }, null);
}

export async function getCategoryRowBySlug(
  slug: string,
): Promise<CategoryRow | null> {
  return safe(async () => {
    const { data } = await db()
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return (data as CategoryRow) ?? null;
  }, null);
}

export async function listAllCategories(): Promise<CategoryRow[]> {
  return safe(async () => {
    const { data } = await db()
      .from("categories")
      .select("*")
      .order("sort_order");
    return (data as CategoryRow[]) ?? [];
  }, []);
}

export async function listCountries(): Promise<Country[]> {
  return safe(async () => {
    const { data } = await db()
      .from("countries")
      .select("*")
      .eq("is_active", true)
      .order("name");
    return (data as Country[]) ?? [];
  }, []);
}

export async function listStates(countryId: string): Promise<State[]> {
  return safe(async () => {
    const { data } = await db()
      .from("states")
      .select("*")
      .eq("country_id", countryId)
      .order("name");
    return (data as State[]) ?? [];
  }, []);
}

export async function listCities(stateId: string): Promise<City[]> {
  return safe(async () => {
    const { data } = await db()
      .from("cities")
      .select("*")
      .eq("state_id", stateId)
      .order("name");
    return (data as City[]) ?? [];
  }, []);
}

export interface BusinessWithPhotoList extends Business {
  photos?: Pick<BusinessPhoto, "url" | "alt_text" | "is_primary" | "sort_order">[];
}

export async function listPublishedBusinesses(
  cityId: string,
  categoryId: string,
): Promise<BusinessWithPhotoList[]> {
  return safe(async () => {
    const { data } = await db()
      .from("businesses")
      .select("*, photos:business_photos(url,alt_text,is_primary,sort_order)")
      .eq("city_id", cityId)
      .eq("category_id", categoryId)
      .eq("status", "published")
      .order("featured_city", { ascending: false })
      .order("rating_avg", { ascending: false });
    return (data as unknown as BusinessWithPhotoList[]) ?? [];
  }, []);
}

/** Categories that actually have published businesses in a city, with counts. */
export async function listCategoriesInCity(
  cityId: string,
): Promise<{ category_id: string; count: number }[]> {
  return safe(async () => {
    const { data } = await db()
      .from("businesses")
      .select("category_id")
      .eq("city_id", cityId)
      .eq("status", "published");
    const counts = new Map<string, number>();
    for (const row of (data as { category_id: string }[]) ?? []) {
      counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
    }
    return [...counts.entries()].map(([category_id, count]) => ({
      category_id,
      count,
    }));
  }, []);
}

/** Count of REAL (non-demo) published listings — drives the SEO index gate. */
export async function realListingCount(
  cityId: string,
  categoryId: string,
): Promise<number> {
  return safe(async () => {
    const { count } = await db()
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("city_id", cityId)
      .eq("category_id", categoryId)
      .eq("status", "published")
      .eq("is_demo", false);
    return count ?? 0;
  }, 0);
}

export interface BusinessFull extends Business {
  city: (City & { state: State & { country: Country } }) | null;
  category: CategoryRow | null;
}

export async function getBusinessBySlugFull(
  slug: string,
): Promise<BusinessFull | null> {
  return safe(async () => {
    const { data } = await db()
      .from("businesses")
      .select(
        "*, city:cities(*, state:states(*, country:countries(*))), category:categories(*)",
      )
      .eq("slug", slug)
      .maybeSingle();
    return (data as unknown as BusinessFull) ?? null;
  }, null);
}

export async function getHours(businessId: string): Promise<BusinessHour[]> {
  return safe(async () => {
    const { data } = await db()
      .from("business_hours")
      .select("*")
      .eq("business_id", businessId)
      .order("day_of_week");
    return (data as BusinessHour[]) ?? [];
  }, []);
}

export async function getPhotos(businessId: string): Promise<BusinessPhoto[]> {
  return safe(async () => {
    const { data } = await db()
      .from("business_photos")
      .select("*")
      .eq("business_id", businessId)
      .order("sort_order");
    return (data as BusinessPhoto[]) ?? [];
  }, []);
}

export interface MenuSectionWithItems extends MenuSection {
  items: MenuItem[];
}

export async function getMenu(
  businessId: string,
): Promise<MenuSectionWithItems[]> {
  return safe(async () => {
    const { data: sections } = await db()
      .from("menu_sections")
      .select("*")
      .eq("business_id", businessId)
      .order("sort_order");
    const { data: items } = await db()
      .from("menu_items")
      .select("*")
      .eq("business_id", businessId)
      .order("sort_order");
    const byId = new Map<string, MenuSectionWithItems>();
    for (const s of (sections as MenuSection[]) ?? [])
      byId.set(s.id, { ...s, items: [] });
    for (const it of (items as MenuItem[]) ?? [])
      byId.get(it.section_id)?.items.push(it);
    return [...byId.values()];
  }, []);
}

export async function getVisibleReviews(
  businessId: string,
): Promise<Review[]> {
  return safe(async () => {
    const { data } = await db()
      .from("reviews")
      .select("*")
      .eq("business_id", businessId)
      .eq("moderation_status", "visible")
      .order("created_at", { ascending: false });
    return (data as Review[]) ?? [];
  }, []);
}

export interface BusinessWithPhotos extends BusinessFull {
  photos?: Pick<BusinessPhoto, "url" | "alt_text" | "is_primary" | "sort_order">[];
}

/** Pick the primary photo (or first by sort order) from a joined photo list. */
export function primaryPhoto(
  b: BusinessWithPhotos,
): { url: string; alt: string } | null {
  const photos = b.photos ?? [];
  if (!photos.length) return null;
  const p =
    photos.find((x) => x.is_primary) ??
    [...photos].sort((a, z) => a.sort_order - z.sort_order)[0];
  return { url: p.url, alt: p.alt_text ?? b.name };
}

/** Featured/top businesses for the homepage (photos joined). */
export async function listFeaturedBusinesses(
  limit = 8,
): Promise<BusinessWithPhotos[]> {
  return safe(async () => {
    const { data, error } = await db()
      .from("businesses")
      .select(
        "*, city:cities(*, state:states(*, country:countries(*))), category:categories(*), photos:business_photos(url,alt_text,is_primary,sort_order)",
      )
      .eq("status", "published")
      .order("featured_city", { ascending: false })
      .order("rating_avg", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as unknown as BusinessWithPhotos[]) ?? [];
  }, []);
}

export interface GeoTree {
  countries: (Country & {
    states: (State & { cities: City[] })[];
  })[];
}

/**
 * Full geo tree for the hero cascading selects. Tiny today (2 countries);
 * switch HeroFinder to an /api/geo per-state fetch once cities exceed ~200.
 */
export const getGeoTree = unstable_cache(
  async (): Promise<GeoTree> => {
    try {
      const [{ data: countries }, { data: states }, { data: cities }] =
        await Promise.all([
          db().from("countries").select("*").eq("is_active", true).order("name"),
          db().from("states").select("*").order("name"),
          db().from("cities").select("*").order("name"),
        ]);
      const stateList = (states as State[]) ?? [];
      const cityList = (cities as City[]) ?? [];
      return {
        countries: ((countries as Country[]) ?? []).map((c) => ({
          ...c,
          states: stateList
            .filter((s) => s.country_id === c.id)
            .map((s) => ({
              ...s,
              cities: cityList.filter((ci) => ci.state_id === s.id),
            })),
        })),
      };
    } catch (e) {
      console.error("[taw geo]", (e as Error).message);
      return { countries: [] };
    }
  },
  ["geo-tree"],
  { revalidate: 3600, tags: ["geo"] },
);

type CityJoin = { city: (City & { state: State & { country: Country } }) | null };

export async function citiesForCategory(
  categoryId: string,
): Promise<{ city: City; state: State; country: Country; count: number }[]> {
  return safe(async () => {
    const { data } = await db()
      .from("businesses")
      .select("city:cities(*, state:states(*, country:countries(*)))")
      .eq("category_id", categoryId)
      .eq("status", "published");
    const map = new Map<
      string,
      { city: City; state: State; country: Country; count: number }
    >();
    for (const row of (data as unknown as CityJoin[]) ?? []) {
      const city = row.city;
      const state = city?.state;
      const country = state?.country;
      if (!city || !state || !country) continue;
      const cur = map.get(city.id);
      if (cur) cur.count++;
      else map.set(city.id, { city, state, country, count: 1 });
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, []);
}

export async function searchBusinesses(q: string): Promise<BusinessFull[]> {
  const term = q.trim().replace(/[%,()]/g, " ");
  if (!term) return [];
  return safe(async () => {
    const { data } = await db()
      .from("businesses")
      .select(
        "*, city:cities(*, state:states(*, country:countries(*))), category:categories(*)",
      )
      .eq("status", "published")
      .or(
        `name.ilike.%${term}%,tagline.ilike.%${term}%,description.ilike.%${term}%`,
      )
      .limit(40);
    return (data as unknown as BusinessFull[]) ?? [];
  }, []);
}
