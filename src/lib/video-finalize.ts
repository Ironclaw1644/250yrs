import "server-only";
import { db } from "./supabase";
import { falResult, falStatus, extractVideoUrl } from "./fal";
import { notify } from "./notify";
import { sendNotificationEmail } from "./email";
import { getSetting } from "./content";
import { brand, siteUrl } from "./brand";

const BUCKET = "taw-media";

interface VideoBrief {
  fal_request_id?: string;
  fal_model?: string;
  preset?: string;
  [k: string]: unknown;
}

/**
 * Pull a finished render off fal into our storage and move the spot into the
 * admin review queue (or reject + refund on failure). Idempotent: exits if
 * the row already has a url or isn't pending. Called by the fal webhook and
 * by page-load reconciliation, so a missed webhook can never strand a spot.
 */
export async function finalizeAiVideo(videoId: string): Promise<"done" | "pending" | "failed" | "skipped"> {
  const svc = db();
  const { data: video } = await svc
    .from("business_videos")
    .select("id, business_id, status, source, url, credits_spent, brief, business:businesses(owner_id, name)")
    .eq("id", videoId)
    .maybeSingle();
  if (!video || video.status !== "pending" || video.url) return "skipped";
  const brief = (video.brief ?? {}) as VideoBrief;
  const requestId = brief.fal_request_id;
  const model = brief.fal_model;
  if (!requestId || !model) return "skipped";

  const biz = (video as unknown as { business?: { owner_id: string | null; name: string } }).business;

  const status = await falStatus(model, requestId);
  if (status === "IN_QUEUE" || status === "IN_PROGRESS" || status === "UNKNOWN") return "pending";

  if (status === "FAILED") {
    await svc
      .from("business_videos")
      .update({ status: "rejected", rejection_reason: "Production failed — credits refunded." })
      .eq("id", videoId)
      .eq("status", "pending");
    if (video.credits_spent > 0) {
      await svc.from("video_credits").insert({
        business_id: video.business_id,
        delta: video.credits_spent,
        reason: `refund:render_failed:${videoId}`,
      });
    }
    if (biz?.owner_id) {
      void notify({
        userId: biz.owner_id,
        type: "video_status",
        title: "That spot didn't come out right",
        body: "Production failed on our side — your credits are back in your wallet. Give it another try.",
        href: `/dashboard/${video.business_id}/videos`,
      });
    }
    return "failed";
  }

  // COMPLETED — fetch the result and pull the file into our storage.
  const payload = await falResult(model, requestId);
  const remoteUrl = extractVideoUrl(payload);
  if (!remoteUrl) {
    return "pending"; // odd state; leave for the next reconcile pass
  }

  const res = await fetch(remoteUrl);
  if (!res.ok) return "pending";
  const bytes = await res.arrayBuffer();
  const path = `business/${video.business_id}/videos/gen-${videoId}.mp4`;
  const { error: upErr } = await svc.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "video/mp4", upsert: true });
  if (upErr) {
    console.error("[finalizeAiVideo] upload", upErr.message);
    return "pending";
  }
  const { data: pub } = svc.storage.from(BUCKET).getPublicUrl(path);

  // Guarded update: only the first finalizer wins (webhook vs reconcile race).
  const { data: updated } = await svc
    .from("business_videos")
    .update({ url: pub.publicUrl })
    .eq("id", videoId)
    .eq("status", "pending")
    .is("url", null)
    .select("id")
    .maybeSingle();
  if (!updated) return "skipped";

  if (biz?.owner_id) {
    void notify({
      userId: biz.owner_id,
      type: "video_status",
      title: "Your spot is rendered — final review now",
      body: "Our team gives every spot a quick look before it goes on air (usually same day).",
      href: `/dashboard/${video.business_id}/videos`,
      email: {
        subject: "Your TV spot is rendered",
        bodyHtml: `<p>The studio finished the spot for <strong>${biz.name}</strong>. It's in final review and will be on air shortly.</p>`,
        ctaLabel: "See its status",
        ctaHref: `/dashboard/${video.business_id}/videos`,
      },
    });
  }
  // Nudge the approval queue.
  void (async () => {
    try {
      const to = await getSetting("site.contact_email", brand.email);
      await sendNotificationEmail({
        to,
        subject: `TV spot rendered — ${biz?.name ?? video.business_id} awaits approval`,
        title: "Spot ready for review",
        bodyHtml: `<p>An AI spot for <strong>${biz?.name ?? "a business"}</strong> finished rendering and is waiting in the approval queue.</p>`,
        ctaLabel: "Review now",
        ctaHref: `${siteUrl}/admin/videos`,
      });
    } catch (e) {
      console.error("[finalizeAiVideo] admin email", (e as Error).message);
    }
  })();

  return "done";
}

/**
 * Reconcile any of this business's pending AI spots older than two minutes —
 * self-healing for missed webhooks, run on dashboard page views.
 */
export async function reconcilePendingVideos(businessId: string): Promise<void> {
  try {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: rows } = await db()
      .from("business_videos")
      .select("id")
      .eq("business_id", businessId)
      .eq("status", "pending")
      .is("url", null)
      .in("source", ["ai_motion", "ai_premium"])
      .lt("created_at", twoMinAgo)
      .limit(5);
    for (const row of rows ?? []) {
      await finalizeAiVideo(row.id);
    }
  } catch (e) {
    console.error("[reconcilePendingVideos]", (e as Error).message);
  }
}
