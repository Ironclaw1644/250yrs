import { NextResponse } from "next/server";
import { finalizeAiVideo } from "@/lib/video-finalize";

export const runtime = "nodejs";
export const maxDuration = 60; // video download + storage upload needs headroom

/**
 * fal.ai queue webhook. Authenticated by the token baked into the URL we hand
 * fal at submit time; the actual result is re-fetched from fal's API rather
 * than trusted from the body, so a forged POST can at worst trigger a no-op
 * reconciliation of a video we already track.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const videoId = url.searchParams.get("video");
  const expected = process.env.FAL_WEBHOOK_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!videoId) {
    return NextResponse.json({ error: "missing video id" }, { status: 400 });
  }

  try {
    const result = await finalizeAiVideo(videoId);
    return NextResponse.json({ received: true, result });
  } catch (e) {
    console.error("[fal webhook]", (e as Error).message);
    // 500 → fal retries the webhook, and page-load reconciliation backstops it.
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
