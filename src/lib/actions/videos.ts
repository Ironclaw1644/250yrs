"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { requireUser, ownsBusiness } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { sendNotificationEmail } from "@/lib/email";
import { getSetting } from "@/lib/content";
import { brand, siteUrl } from "@/lib/brand";
import { VIDEO_COSTS, type AiStyle } from "@/lib/video-plans";

type Result = { ok: boolean; error?: string };

const BUCKET = "taw-media";
const MAX_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_SECONDS = 60;
const ALLOWED = { "video/mp4": "mp4", "video/webm": "webm" } as const;

/** Current credit balance for a business (sum of the ledger). */
export async function getCreditBalance(businessId: string): Promise<number> {
  const { data } = await db()
    .from("video_credits")
    .select("delta")
    .eq("business_id", businessId);
  return ((data as { delta: number }[]) ?? []).reduce((s, r) => s + r.delta, 0);
}

async function alertAdmins(businessName: string, what: string) {
  try {
    const to = await getSetting("site.contact_email", brand.email);
    await sendNotificationEmail({
      to,
      subject: `TV spot awaiting review — ${businessName}`,
      title: "New TV spot in the queue",
      bodyHtml: `<p><strong>${businessName}</strong> submitted a ${what}. It's waiting for approval.</p>`,
      ctaLabel: "Review the queue",
      ctaHref: `${siteUrl}/admin/videos`,
    });
  } catch (e) {
    console.error("[alertAdmins]", (e as Error).message);
  }
}

/**
 * Step 1 of the upload flow: mint a signed URL so the browser can push the
 * video straight to storage (server actions cap out at 8MB — video can't
 * travel through them). The path is server-chosen, so an owner can never
 * write outside their own folder.
 */
export async function createVideoUploadUrl(
  businessId: string,
  contentType: string,
  size: number,
): Promise<{ ok: boolean; path?: string; token?: string; error?: string }> {
  await requireUser();
  if (!(await ownsBusiness(businessId))) return { ok: false, error: "Not your business." };
  const ext = ALLOWED[contentType as keyof typeof ALLOWED];
  if (!ext) return { ok: false, error: "Use an MP4 or WebM video." };
  if (size > MAX_BYTES) return { ok: false, error: "Video too large (max 100MB)." };

  const path = `business/${businessId}/videos/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await db()
    .storage.from(BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: error?.message ?? "Could not start upload." };
  return { ok: true, path: data.path, token: data.token };
}

/** Step 2: after the browser upload succeeds, register the pending spot. */
export async function finalizeVideoUpload(
  businessId: string,
  path: string,
  title: string,
  durationSeconds: number,
): Promise<Result> {
  await requireUser();
  if (!(await ownsBusiness(businessId))) return { ok: false, error: "Not your business." };
  if (!path.startsWith(`business/${businessId}/videos/`))
    return { ok: false, error: "Invalid upload path." };
  if (durationSeconds > MAX_SECONDS)
    return { ok: false, error: "Spots can be at most 60 seconds." };

  const svc = db();
  // The object must actually exist before we trust the client's claim.
  const folder = path.slice(0, path.lastIndexOf("/"));
  const name = path.slice(path.lastIndexOf("/") + 1);
  const { data: listing } = await svc.storage.from(BUCKET).list(folder, { search: name });
  if (!listing?.some((f) => f.name === name))
    return { ok: false, error: "Upload didn't finish — try again." };

  const { data: pub } = svc.storage.from(BUCKET).getPublicUrl(path);
  const { data: biz } = await svc
    .from("businesses")
    .select("owner_id, name")
    .eq("id", businessId)
    .maybeSingle();

  const { error } = await svc.from("business_videos").insert({
    business_id: businessId,
    url: pub.publicUrl,
    title: title.trim().slice(0, 120) || `${biz?.name ?? "Business"} TV spot`,
    is_ad: true,
    status: "pending",
    source: "upload",
    duration_seconds: Math.round(durationSeconds) || null,
  });
  if (error) return { ok: false, error: error.message };

  if (biz?.owner_id) {
    void notify({
      userId: biz.owner_id,
      type: "video_status",
      title: "Your TV spot is in review",
      body: "We check every spot before it goes on air — usually within a day.",
      href: `/dashboard/${businessId}/videos`,
    });
  }
  void alertAdmins(biz?.name ?? businessId, "video upload");
  revalidatePath(`/dashboard/${businessId}/videos`);
  return { ok: true };
}

const DAILY_GENERATION_CAP = 3;

/**
 * "Create with AI" v2: preset-driven, fal.ai-powered. Debits credits
 * atomically, assembles the prompt server-side from the chosen preset (no
 * free-form prompts anywhere), and queues the render on fal with our webhook
 * attached. Any failure after the debit refunds automatically.
 */
export async function submitAiVideo(
  businessId: string,
  input: {
    style: AiStyle;
    presetId: string;
    photoId: string;
    tagline: string;
    details: string;
  },
): Promise<Result> {
  const { falConfigured, falSubmit, FAL_MODELS, FAL_DURATIONS } = await import("@/lib/fal");
  const { PRESET_BY_ID, buildPrompt } = await import("@/lib/ad-presets");

  await requireUser();
  if (!(await ownsBusiness(businessId))) return { ok: false, error: "Not your business." };
  if (!falConfigured)
    return { ok: false, error: "The studio is warming up — check back shortly." };
  const { style, presetId, photoId } = input;
  const cost = VIDEO_COSTS[style];
  if (!cost) return { ok: false, error: "Pick a production style." };
  const preset = PRESET_BY_ID[presetId];
  if (!preset) return { ok: false, error: "Pick an ad style." };
  if (!photoId) return { ok: false, error: "Pick the photo for this ad." };

  const svc = db();

  // Guardrail: cap generations per business per day (cost control).
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: todays } = await svc
    .from("business_videos")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .in("source", ["ai_motion", "ai_premium"])
    .gte("created_at", dayAgo);
  if ((todays ?? 0) >= DAILY_GENERATION_CAP)
    return {
      ok: false,
      error: `Studio limit reached (${DAILY_GENERATION_CAP} spots per day) — try again tomorrow.`,
    };

  // The photo must belong to this business.
  const { data: photo } = await svc
    .from("business_photos")
    .select("url")
    .eq("id", photoId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (!photo?.url) return { ok: false, error: "That photo isn't in your gallery." };

  const { data: biz } = await svc
    .from("businesses")
    .select("owner_id, name, city:cities(name)")
    .eq("id", businessId)
    .maybeSingle();
  const cityName =
    (biz as { city?: { name?: string } } | null)?.city?.name ?? "";

  const { data: spent, error: rpcError } = await svc.rpc("spend_video_credits", {
    p_business_id: businessId,
    p_cost: cost,
    p_reason: `spend:${style}:${presetId}`,
  });
  if (rpcError) return { ok: false, error: rpcError.message };
  if (!spent)
    return { ok: false, error: "Not enough credits — grab a pack above and try again." };

  const refund = async (reason: string) => {
    await svc.from("video_credits").insert({
      business_id: businessId,
      delta: cost,
      reason,
    });
  };

  const tagline = input.tagline.trim().slice(0, 140);
  const details = input.details.trim().slice(0, 500);
  const prompt = buildPrompt(preset, {
    business: biz?.name ?? "the business",
    city: cityName,
    tagline,
    details,
  });
  const model = FAL_MODELS[style];

  const { data: row, error } = await svc
    .from("business_videos")
    .insert({
      business_id: businessId,
      url: null,
      thumbnail_url: photo.url, // the source photo doubles as the poster
      title: `${biz?.name ?? "Business"} — ${preset.name}`,
      is_ad: true,
      status: "pending",
      source: style,
      duration_seconds: FAL_DURATIONS[style],
      credits_spent: cost,
      brief: {
        style,
        preset: presetId,
        tagline,
        details,
        photo_id: photoId,
        photo_url: photo.url,
        fal_model: model,
      },
    })
    .select("id, brief")
    .single();
  if (error || !row) {
    await refund(`refund:brief_failed:${style}`);
    return { ok: false, error: error?.message ?? "Could not queue the spot." };
  }

  // Model-specific inputs (rails: fixed duration/aspect, audio on premium).
  const falInput: Record<string, unknown> =
    style === "ai_premium"
      ? {
          prompt,
          image_url: photo.url,
          duration: "8s",
          generate_audio: true,
          resolution: "720p",
        }
      : {
          prompt,
          image_url: photo.url,
          duration: "5",
          negative_prompt: "text, captions, watermark, logo, blurry, distorted",
        };

  const submit = await falSubmit(model, falInput, row.id);
  if (!submit.ok) {
    await svc
      .from("business_videos")
      .update({ status: "rejected", rejection_reason: "Production failed to start — credits refunded." })
      .eq("id", row.id);
    await refund(`refund:submit_failed:${row.id}`);
    console.error("[submitAiVideo]", submit.error);
    return { ok: false, error: "The studio couldn't start this one — your credits were refunded. Try again in a few minutes." };
  }

  await svc
    .from("business_videos")
    .update({ brief: { ...(row.brief as Record<string, unknown>), fal_request_id: submit.requestId } })
    .eq("id", row.id);

  if (biz?.owner_id) {
    void notify({
      userId: biz.owner_id,
      type: "video_status",
      title: "Your TV spot is in production",
      body: "We'll notify you the moment it's ready to go on air.",
      href: `/dashboard/${businessId}/videos`,
      email: {
        subject: "Your TV spot is in production",
        bodyHtml: `<p>Our studio is working on the <strong>${style === "ai_motion" ? "Motion" : "Premium AI"}</strong> spot for <strong>${biz.name}</strong>. You'll get a note here the moment it's ready for air.</p>`,
        ctaLabel: "See its status",
        ctaHref: `/dashboard/${businessId}/videos`,
      },
    });
  }
  void alertAdmins(biz?.name ?? businessId, `${style} production brief`);
  revalidatePath(`/dashboard/${businessId}/videos`);
  return { ok: true };
}

/** Owner housekeeping: remove one of their own spots (no credit refund). */
export async function deleteVideo(businessId: string, videoId: string): Promise<Result> {
  await requireUser();
  if (!(await ownsBusiness(businessId))) return { ok: false, error: "Not your business." };
  const { error } = await db()
    .from("business_videos")
    .delete()
    .eq("id", videoId)
    .eq("business_id", businessId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/dashboard/${businessId}/videos`);
  return { ok: true };
}
