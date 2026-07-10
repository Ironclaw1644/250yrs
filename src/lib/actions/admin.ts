"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { assertAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { uploadToBucket } from "@/lib/storage";
import { isValidCopyKey } from "@/lib/copy-registry";
import { notify } from "@/lib/notify";

type Result = { ok: boolean; error?: string };

function fail(error: string): Result {
  return { ok: false, error };
}

async function gate(): Promise<{ id: string } | null> {
  try {
    return await assertAdmin();
  } catch {
    return null;
  }
}

/** Publish / suspend / archive a business (admin takedown & restore). */
export async function setBusinessStatus(
  businessId: string,
  status: "published" | "suspended" | "draft" | "archived",
): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const svc = db();
  const { data: biz } = await svc
    .from("businesses")
    .select("owner_id, name, status")
    .eq("id", businessId)
    .maybeSingle();
  const { error } = await svc
    .from("businesses")
    .update({
      status,
      ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("id", businessId);
  if (error) return fail(error.message);
  void audit(admin.id, `business.${status}`, "business", businessId);
  if (biz?.owner_id && biz.status !== status && (status === "published" || status === "suspended")) {
    void notify({
      userId: biz.owner_id,
      type: "business_status",
      title:
        status === "published"
          ? `${biz.name} is live on Main Street!`
          : `${biz.name} has been suspended`,
      body:
        status === "published"
          ? "Customers can now find your listing."
          : "Contact us if you believe this was a mistake.",
      href: status === "published" ? "/dashboard" : "/contact",
      email: {
        subject:
          status === "published"
            ? `You're live: ${biz.name}`
            : `Action needed: ${biz.name} was suspended`,
        bodyHtml:
          status === "published"
            ? `<p><strong>${biz.name}</strong> is now published and visible to customers. Add photos, hours, and a TV spot to stand out.</p>`
            : `<p><strong>${biz.name}</strong> was suspended by our moderation team. Reply to this email or use the contact page if you'd like to appeal.</p>`,
        ctaLabel: status === "published" ? "Open your dashboard" : "Contact us",
        ctaHref: status === "published" ? "/dashboard" : "/contact",
      },
    });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setBusinessFeatured(
  businessId: string,
  featured: boolean,
): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const { error } = await db()
    .from("businesses")
    .update({ featured_city: featured })
    .eq("id", businessId);
  if (error) return fail(error.message);
  void audit(admin.id, featured ? "business.feature" : "business.unfeature", "business", businessId);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteBusiness(businessId: string): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const { error } = await db().from("businesses").delete().eq("id", businessId);
  if (error) return fail(error.message);
  void audit(admin.id, "business.delete", "business", businessId);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setUserRole(
  userId: string,
  role: "customer" | "business_owner" | "admin",
): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  if (userId === admin.id && role !== "admin") {
    return fail("You can't remove your own admin role.");
  }
  const { error } = await db().from("profiles").update({ role }).eq("id", userId);
  if (error) return fail(error.message);
  void audit(admin.id, `user.role.${role}`, "profile", userId);
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setReviewStatus(
  reviewId: string,
  status: "visible" | "flagged" | "hidden" | "removed",
): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const { error } = await db()
    .from("reviews")
    .update({ moderation_status: status })
    .eq("id", reviewId);
  if (error) return fail(error.message);
  void audit(admin.id, `review.${status}`, "review", reviewId);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Save site settings (contact info etc.) from the admin Settings form. */
export async function updateSiteSettings(formData: FormData): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const entries: [string, string][] = [];
  for (const [k, v] of formData.entries()) {
    if (typeof v !== "string") continue;
    const key = `site.${k}`;
    if (isValidCopyKey(key)) entries.push([key, v.trim()]);
  }
  for (const [key, value] of entries) {
    const { error } = await db()
      .from("site_content")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) return fail(error.message);
  }
  void audit(admin.id, "settings.update", "site_content", null, {
    keys: entries.map(([k]) => k),
  });
  const { revalidateTag } = await import("next/cache");
  revalidateTag("site-content");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Upload an image into a named site slot (img.<page>.<slot>). */
export async function uploadSiteImage(formData: FormData): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const slot = String(formData.get("slot") || "");
  const file = formData.get("file") as File | null;
  const key = `img.${slot}`;
  if (!file || file.size === 0) return fail("Choose an image file.");
  if (!isValidCopyKey(key)) return fail("Invalid image slot.");
  if (file.size > 6 * 1024 * 1024) return fail("Image too large (max 6MB).");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  try {
    const url = await uploadToBucket(`site/${slot.replace(/\./g, "-")}.${ext}`, file);
    const { error } = await db()
      .from("site_content")
      .upsert({ key, value: url }, { onConflict: "key" });
    if (error) return fail(error.message);
  } catch (e) {
    return fail((e as Error).message);
  }
  void audit(admin.id, "settings.image", "site_content", null, { key });
  const { revalidateTag } = await import("next/cache");
  revalidateTag("site-content");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Resolve or dismiss a review report from the moderation queue. */
export async function resolveReport(
  reportId: string,
  resolution: "resolved" | "dismissed",
): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const { error } = await db()
    .from("review_reports")
    .update({
      status: resolution,
      resolved_by: admin.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);
  if (error) return fail(error.message);
  void audit(admin.id, `report.${resolution}`, "review_report", reportId);
  revalidatePath("/admin/reviews");
  return { ok: true };
}

/** Approve or reject a TV spot. Rejecting an AI spot refunds its credits. */
export async function setVideoStatus(
  videoId: string,
  status: "ready" | "rejected",
  reason?: string,
): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const svc = db();
  const { data: video } = await svc
    .from("business_videos")
    .select("id, business_id, status, source, url, credits_spent, business:businesses(owner_id, name)")
    .eq("id", videoId)
    .maybeSingle();
  if (!video) return fail("Video not found.");
  if (status === "ready" && !video.url)
    return fail("This AI spot hasn't been rendered yet — nothing to approve.");

  const { error } = await svc
    .from("business_videos")
    .update({ status, rejection_reason: status === "rejected" ? reason?.trim() || null : null })
    .eq("id", videoId);
  if (error) return fail(error.message);
  void audit(admin.id, `video.${status}`, "business_video", videoId, reason ? { reason } : undefined);

  // Refund credits when an AI production is rejected.
  if (status === "rejected" && video.source !== "upload" && video.credits_spent > 0 && video.status !== "rejected") {
    await svc.from("video_credits").insert({
      business_id: video.business_id,
      delta: video.credits_spent,
      reason: `refund:rejected:${videoId}`,
    });
  }

  const biz = (video as unknown as { business?: { owner_id: string | null; name: string } }).business;
  if (biz?.owner_id) {
    void notify({
      userId: biz.owner_id,
      type: "video_status",
      title:
        status === "ready"
          ? `Your TV spot for ${biz.name} is ON AIR!`
          : `Your TV spot needs changes`,
      body:
        status === "ready"
          ? "Customers can watch it on your listing right now."
          : reason?.trim() ||
            (video.source === "upload"
              ? "It didn't pass review — check the notes and try again."
              : "It didn't pass review — your credits have been refunded."),
      href:
        status === "ready"
          ? `/dashboard/${video.business_id}/videos`
          : `/dashboard/${video.business_id}/videos`,
      email: {
        subject:
          status === "ready" ? "Your TV spot is on air" : "Your TV spot needs changes",
        bodyHtml:
          status === "ready"
            ? `<p>The spot for <strong>${biz.name}</strong> passed review and is now playing on your public listing. Share the page and let it work for you.</p>`
            : `<p>The spot for <strong>${biz.name}</strong> didn't pass review${reason?.trim() ? `: <em>${reason.trim()}</em>` : ""}.${video.source !== "upload" ? " Your credits have been refunded." : ""}</p>`,
        ctaLabel: "Open TV Ads",
        ctaHref: `/dashboard/${video.business_id}/videos`,
      },
    });
  }
  revalidatePath("/admin/videos");
  revalidatePath("/", "layout");
  return { ok: true };
}
