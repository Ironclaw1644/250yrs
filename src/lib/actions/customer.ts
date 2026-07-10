"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { REPORT_REASONS } from "@/lib/report-reasons";

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
  const svc = db();
  // Create vs edit — only a brand-new review should ping the owner.
  const { data: existing } = await svc
    .from("reviews")
    .select("id")
    .eq("business_id", businessId)
    .eq("author_id", user.id)
    .maybeSingle();
  const { error } = await svc
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
  if (!existing) {
    const { data: biz } = await svc
      .from("businesses")
      .select("owner_id, name")
      .eq("id", businessId)
      .maybeSingle();
    if (biz?.owner_id && biz.owner_id !== user.id) {
      void notify({
        userId: biz.owner_id,
        type: "review_received",
        title: `New ${r}★ review on ${biz.name}`,
        body: body.trim().slice(0, 120) || undefined,
        href: path,
        email: {
          subject: `You got a new ${r}-star review`,
          bodyHtml: `<p>A customer just reviewed <strong>${biz.name}</strong>. A quick, friendly reply shows every future customer you care.</p>`,
          ctaLabel: "Read & respond",
          ctaHref: path,
        },
      });
    }
  }
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
    .select("id, business_id, author_id, response_body, business:businesses(owner_id, name)")
    .eq("id", reviewId)
    .maybeSingle();
  const biz = (review as {
    business?: { owner_id: string | null; name: string };
  } | null)?.business;
  if (!review || biz?.owner_id !== user.id) return { ok: false, error: "Not your business." };
  const firstResponse = !review.response_body;
  const { error } = await svc
    .from("reviews")
    .update({
      response_body: body.trim().slice(0, 2000),
      response_at: new Date().toISOString(),
    })
    .eq("id", reviewId);
  if (error) return { ok: false, error: error.message };
  if (firstResponse && review.author_id && review.author_id !== user.id) {
    void notify({
      userId: review.author_id,
      type: "owner_response",
      title: `${biz.name} replied to your review`,
      body: body.trim().slice(0, 120),
      href: path,
      email: {
        subject: `${biz.name} replied to your review`,
        bodyHtml: `<p><strong>${biz.name}</strong> responded to the review you left. See what they said:</p>`,
        ctaLabel: "See the reply",
        ctaHref: path,
      },
    });
  }
  revalidatePath(path);
  return { ok: true };
}

/** File a report against a review. One per user per review (deduped in DB). */
export async function reportReview(
  reviewId: string,
  reason: string,
  note: string,
): Promise<{ ok: boolean; already?: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in to report a review." };
  if (!(reason in REPORT_REASONS)) return { ok: false, error: "Pick a reason." };
  const svc = db();
  const { error } = await svc.from("review_reports").insert({
    review_id: reviewId,
    reporter_id: user.id,
    reason,
    note: note.trim().slice(0, 500) || null,
  });
  if (error) {
    if (error.code === "23505") return { ok: true, already: true };
    return { ok: false, error: error.message };
  }
  // Alert the moderation inbox (fire-and-forget).
  void (async () => {
    try {
      const { getSetting } = await import("@/lib/content");
      const { sendNotificationEmail } = await import("@/lib/email");
      const { brand, siteUrl } = await import("@/lib/brand");
      const to = await getSetting("site.contact_email", brand.email);
      await sendNotificationEmail({
        to,
        subject: "A review was reported",
        title: "New review report",
        bodyHtml: `<p>A user reported a review (<strong>${REPORT_REASONS[reason as keyof typeof REPORT_REASONS]}</strong>). It's waiting in the moderation queue.</p>`,
        ctaLabel: "Open the queue",
        ctaHref: `${siteUrl}/admin/reviews`,
      });
    } catch (e) {
      console.error("[reportReview email]", (e as Error).message);
    }
  })();
  return { ok: true };
}
