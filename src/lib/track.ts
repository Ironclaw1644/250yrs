import "server-only";
import { db } from "./supabase";

/** Record a listing view (powering the owner's "how many people viewed my ad"). */
export async function trackImpression(
  businessId: string,
  surface: string,
  cityId?: string | null,
): Promise<void> {
  try {
    await db().from("ad_impressions").insert({
      business_id: businessId,
      surface,
      city_id: cityId ?? null,
    });
  } catch (e) {
    console.error("[track]", (e as Error).message);
  }
}
