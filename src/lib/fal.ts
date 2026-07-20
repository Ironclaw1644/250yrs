import "server-only";
import { siteUrl } from "./brand";

/**
 * fal.ai queue client for TV-spot generation. Everything is env-gated: with
 * no FAL_KEY the studio still renders but production is disabled, matching
 * the site's degrade-gracefully pattern.
 *
 * Flow: submit → fal renders (2–5 min) → fal calls our webhook → we pull the
 * mp4 into Supabase storage → the spot enters the admin approval queue.
 */
const KEY = process.env.FAL_KEY;

export const falConfigured = Boolean(KEY);

/** Model per tier — env-overridable so we can swap without a deploy. */
export const FAL_MODELS = {
  ai_motion:
    process.env.FAL_MODEL_MOTION ?? "fal-ai/kling-video/v2.1/standard/image-to-video",
  ai_premium: process.env.FAL_MODEL_PREMIUM ?? "fal-ai/veo3/fast/image-to-video",
} as const;

/** Fixed durations per tier (seconds) — part of the "rails, not freedom" design. */
export const FAL_DURATIONS = { ai_motion: 5, ai_premium: 8 } as const;

function authHeaders(): Record<string, string> {
  if (!KEY) throw new Error("FAL_KEY missing");
  return { Authorization: `Key ${KEY}`, "Content-Type": "application/json" };
}

export interface FalSubmitResult {
  ok: boolean;
  requestId?: string;
  error?: string;
}

/** Submit a generation to the fal queue with our webhook attached. */
export async function falSubmit(
  model: string,
  input: Record<string, unknown>,
  videoId: string,
): Promise<FalSubmitResult> {
  const token = process.env.FAL_WEBHOOK_TOKEN ?? "";
  const webhook = `${siteUrl}/api/webhooks/fal?token=${token}&video=${videoId}`;
  try {
    const res = await fetch(
      `https://queue.fal.run/${model}?fal_webhook=${encodeURIComponent(webhook)}`,
      { method: "POST", headers: authHeaders(), body: JSON.stringify(input) },
    );
    const data = (await res.json()) as { request_id?: string; detail?: unknown };
    if (!res.ok || !data.request_id) {
      return {
        ok: false,
        error: `fal submit failed (${res.status}): ${JSON.stringify(data.detail ?? data).slice(0, 200)}`,
      };
    }
    return { ok: true, requestId: data.request_id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Poll a queued request's status (reconciliation for missed webhooks). */
export async function falStatus(
  model: string,
  requestId: string,
): Promise<"IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "UNKNOWN"> {
  try {
    // Status lives under the model's base path (strip subpaths beyond owner/model).
    const base = model.split("/").slice(0, 2).join("/");
    const res = await fetch(
      `https://queue.fal.run/${base}/requests/${requestId}/status`,
      { headers: authHeaders() },
    );
    if (!res.ok) return res.status === 404 ? "FAILED" : "UNKNOWN";
    const data = (await res.json()) as { status?: string };
    if (data.status === "COMPLETED") return "COMPLETED";
    if (data.status === "IN_PROGRESS") return "IN_PROGRESS";
    if (data.status === "IN_QUEUE") return "IN_QUEUE";
    return "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}

/** Fetch a completed request's result payload. */
export async function falResult(
  model: string,
  requestId: string,
): Promise<Record<string, unknown> | null> {
  try {
    const base = model.split("/").slice(0, 2).join("/");
    const res = await fetch(`https://queue.fal.run/${base}/requests/${requestId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Pull the video URL out of a fal result payload (models vary in shape). */
export function extractVideoUrl(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  const video = payload.video as { url?: string } | undefined;
  if (video?.url) return video.url;
  const videos = payload.videos as { url?: string }[] | undefined;
  if (videos?.[0]?.url) return videos[0].url;
  return null;
}
