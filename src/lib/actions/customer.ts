"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";

/** Fire-and-forget interaction tracking (call/directions/share/coupon). */
export async function trackClick(
  businessId: string,
  action: string,
  surface = "business_page",
): Promise<void> {
  try {
    const user = await getSessionUser();
    await db().from("ad_clicks").insert({
      business_id: businessId,
      viewer_id: user?.id ?? null,
      action,
      surface,
    });
  } catch (e) {
    console.error("[trackClick]", (e as Error).message);
  }
}

/** Toggle a favorite; returns the new saved state (or null if signed out). */
export async function toggleFavorite(
  businessId: string,
): Promise<{ saved: boolean } | { signedOut: true }> {
  const user = await getSessionUser();
  if (!user) return { signedOut: true };
  const svc = db();
  const { data: existing } = await svc
    .from("favorites")
    .select("id")
    .eq("customer_id", user.id)
    .eq("business_id", businessId)
    .maybeSingle();
  if (existing) {
    await svc.from("favorites").delete().eq("id", existing.id);
    return { saved: false };
  }
  await svc.from("favorites").insert({ customer_id: user.id, business_id: businessId });
  return { saved: true };
}

/** Create or update the caller's review (one per business per customer). */
export async function submitReview(
  businessId: string,
  rating: number,
  body: string,
  path: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in to leave a review." };
  const r = Math.round(rating);
  if (r < 1 || r > 5) return { ok: false, error: "Pick a star rating." };
  const { error } = await db()
    .from("reviews")
    .upsert(
      {
        business_id: businessId,
        author_id: user.id,
        rating: r,
        body: body.trim().slice(0, 2000) || null,
        moderation_status: "visible",
      },
      { onConflict: "business_id,author_id" },
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath(path);
  return { ok: true };
}

/** Owner reply to a review on a business they own. */
export async function respondToReview(
  reviewId: string,
  body: string,
  path: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const svc = db();
  const { data: review } = await svc
    .from("reviews")
    .select("id, business_id, business:businesses(owner_id)")
    .eq("id", reviewId)
    .maybeSingle();
  const ownerId = (review as { business?: { owner_id: string | null } } | null)
    ?.business?.owner_id;
  if (!review || ownerId !== user.id) return { ok: false, error: "Not your business." };
  const { error } = await svc
    .from("reviews")
    .update({
      response_body: body.trim().slice(0, 2000),
      response_at: new Date().toISOString(),
    })
    .eq("id", reviewId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(path);
  return { ok: true };
}
