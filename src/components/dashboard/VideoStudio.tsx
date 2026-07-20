"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { CheckoutEmbed } from "@/components/CheckoutEmbed";
import { AdStudioWizard } from "./AdStudioWizard";
import {
  createVideoUploadUrl,
  finalizeVideoUpload,
  deleteVideo,
} from "@/lib/actions/videos";
import {
  CREDIT_PACKS_INFO,
  VIDEO_COSTS,
  formatUsd,
  type CreditPack,
} from "@/lib/video-plans";

export interface StudioVideo {
  id: string;
  title: string | null;
  url: string | null;
  thumbnail_url: string | null;
  status: string;
  source: string;
  duration_seconds: number | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface StudioPhoto {
  id: string;
  url: string;
  alt_text: string | null;
}

const MAX_BYTES = 100 * 1024 * 1024;
const MAX_SECONDS = 60;

function StatusBadge({ v }: { v: StudioVideo }) {
  if (v.status === "ready")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 font-sans text-xs font-bold text-success">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> ON AIR
      </span>
    );
  if (v.status === "rejected")
    return (
      <span className="rounded-full bg-barn/15 px-2.5 py-0.5 font-sans text-xs font-bold text-barn">
        Needs changes
      </span>
    );
  return (
    <span className="rounded-full bg-gold/20 px-2.5 py-0.5 font-sans text-xs font-bold text-navy">
      In production
    </span>
  );
}

export function VideoStudio({
  businessId,
  balance,
  videos,
  photos,
  categorySlug,
  studioReady,
}: {
  businessId: string;
  balance: number;
  videos: StudioVideo[];
  photos: StudioPhoto[];
  categorySlug: string | null;
  studioReady: boolean;
}) {
  const router = useRouter();
  const [pack, setPack] = useState<CreditPack | null>(null);
  const [mode, setMode] = useState<"upload" | "ai" | null>(null);

  // Upload state
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const [pending, start] = useTransition();

  async function handleUpload(file: File) {
    setUploadErr(null);
    if (file.size > MAX_BYTES) return setUploadErr("Video too large (max 100MB).");

    // Read the duration client-side before spending bandwidth.
    const duration = await new Promise<number>((resolve, reject) => {
      const el = document.createElement("video");
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        URL.revokeObjectURL(el.src);
        resolve(el.duration);
      };
      el.onerror = () => reject(new Error("Couldn't read that video file."));
      el.src = URL.createObjectURL(file);
    }).catch((e: Error) => {
      setUploadErr(e.message);
      return null;
    });
    if (duration === null) return;
    if (duration > MAX_SECONDS)
      return setUploadErr(`Spots max out at ${MAX_SECONDS} seconds — this one is ${Math.round(duration)}s.`);

    const signed = await createVideoUploadUrl(businessId, file.type, file.size);
    if (!signed.ok || !signed.path || !signed.token)
      return setUploadErr(signed.error ?? "Could not start the upload.");

    setUploadPct(0);
    try {
      const { createBrowserSupabase } = await import("@/lib/supabase-browser");
      const { error } = await createBrowserSupabase()
        .storage.from("taw-media")
        .uploadToSignedUrl(signed.path, signed.token, file, { upsert: true });
      if (error) throw new Error(error.message);
      setUploadPct(100);
      const fin = await finalizeVideoUpload(
        businessId,
        signed.path,
        file.name.replace(/\.[^.]+$/, ""),
        duration,
      );
      if (!fin.ok) throw new Error(fin.error ?? "Could not save the spot.");
      setMode(null);
      router.refresh();
    } catch (e) {
      setUploadErr((e as Error).message);
    } finally {
      setUploadPct(null);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* ============ Credit wallet ============ */}
      <div className="sign-plate p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-sans text-eyebrow font-bold uppercase tracking-[0.1em] text-gold">
              TV-spot credits
            </p>
            <p className="mt-1 font-heading text-5xl font-bold text-cream">
              {balance}
              <span className="ml-2 text-lg font-semibold text-cream">
                credit{balance === 1 ? "" : "s"}
              </span>
            </p>
          </div>
          <Icon name="tv" className="text-5xl text-gold/70" />
        </div>
        <p className="mt-3 max-w-lg text-small text-cream">
          Credits pay for AI-made commercials: <strong className="text-gold">Motion</strong> spots
          cost {VIDEO_COSTS.ai_motion} credit, <strong className="text-gold">Premium AI</strong>{" "}
          spots cost {VIDEO_COSTS.ai_premium}. Uploading your own video is always free.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(Object.entries(CREDIT_PACKS_INFO) as [CreditPack, (typeof CREDIT_PACKS_INFO)[CreditPack]][]).map(
            ([key, p]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPack(pack === key ? null : key)}
                className={`rounded-lg border-2 p-3 text-left transition-all duration-std ease-warm ${
                  pack === key
                    ? "border-gold bg-gold/15"
                    : "border-cream/20 bg-navy/40 hover:border-gold/60"
                }`}
              >
                <p className="font-sans text-small font-bold text-cream">
                  {p.label}
                  {key === "pro" && (
                    <span className="ml-2 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-navy-deep">
                      POPULAR
                    </span>
                  )}
                </p>
                <p className="font-heading text-2xl font-bold text-gold">{formatUsd(p.amountCents)}</p>
                <p className="text-small text-cream">{p.blurb}</p>
              </button>
            ),
          )}
        </div>
      </div>

      {pack && (
        <div className="card overflow-hidden !p-0">
          <div className="flex items-center justify-between border-b border-navy/10 px-5 py-3">
            <p className="font-sans font-bold text-navy">
              {CREDIT_PACKS_INFO[pack].label} pack — {CREDIT_PACKS_INFO[pack].blurb}
            </p>
            <button
              type="button"
              onClick={() => setPack(null)}
              className="text-stone hover:text-barn"
              aria-label="Close checkout"
            >
              <Icon name="xmark" />
            </button>
          </div>
          {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? (
            <CheckoutEmbed businessId={businessId} pack={pack} />
          ) : (
            <p className="px-5 py-6 text-small text-stone">
              Payments aren&apos;t connected yet — credit packs will be purchasable as soon
              as the site&apos;s Stripe account is live.
            </p>
          )}
        </div>
      )}

      {/* ============ Your spots ============ */}
      <section className="card p-6">
        <h2 className="flex items-center gap-2 font-heading text-h3 text-navy">
          <Icon name="film" className="text-gold" /> Your spots
        </h2>
        {videos.length === 0 ? (
          <p className="mt-3 text-small text-stone">
            No spots yet — upload one or let our studio make one below.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-navy/10">
            {videos.map((v) => (
              <li key={v.id} className="flex items-center gap-4 py-3.5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-navy">
                  <Icon
                    name={v.source === "upload" ? "video" : "wand-magic-sparkles"}
                    className="text-gold"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans font-bold text-navy">{v.title ?? "TV spot"}</p>
                  <p className="text-xs text-stone">
                    {v.source === "upload"
                      ? "Uploaded"
                      : v.source === "ai_motion"
                        ? "Motion"
                        : "Premium AI"}
                    {v.duration_seconds ? ` · ${v.duration_seconds}s` : ""}
                    {" · "}
                    {new Date(v.created_at).toLocaleDateString("en-US")}
                  </p>
                  {v.status === "pending" && (
                    <p className="mt-0.5 text-xs font-semibold text-navy/70">
                      In production — we&apos;ll notify you when it&apos;s ready.
                    </p>
                  )}
                  {v.status === "rejected" && v.rejection_reason && (
                    <p className="mt-0.5 text-xs text-barn">{v.rejection_reason}</p>
                  )}
                </div>
                <StatusBadge v={v} />
                {v.status === "ready" && v.url && (
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-navy hover:text-barn"
                    aria-label="Preview spot"
                  >
                    <Icon name="play" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => start(async () => {
                    await deleteVideo(businessId, v.id);
                    router.refresh();
                  })}
                  className="text-stone/70 hover:text-barn"
                  aria-label="Delete spot"
                >
                  <Icon name="trash" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ============ Create ============ */}
      <section className="card p-6">
        <h2 className="flex items-center gap-2 font-heading text-h3 text-navy">
          <Icon name="plus" className="text-gold" /> Add a spot
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode(mode === "upload" ? null : "upload")}
            className={`rounded-xl border-2 p-4 text-left transition-all duration-std ease-warm ${
              mode === "upload" ? "border-gold bg-gold/10" : "border-navy/15 hover:border-gold/60"
            }`}
          >
            <Icon name="upload" className="text-xl text-barn" />
            <p className="mt-2 font-sans font-bold text-navy">Upload your own</p>
            <p className="text-small text-stone">MP4/WebM · up to 60s · free</p>
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "ai" ? null : "ai")}
            className={`rounded-xl border-2 p-4 text-left transition-all duration-std ease-warm ${
              mode === "ai" ? "border-gold bg-gold/10" : "border-navy/15 hover:border-gold/60"
            }`}
          >
            <Icon name="wand-magic-sparkles" className="text-xl text-barn" />
            <p className="mt-2 font-sans font-bold text-navy">Create with AI</p>
            <p className="text-small text-stone">Our studio makes it · from 1 credit</p>
          </button>
        </div>

        {mode === "upload" && (
          <div className="mt-5 rounded-xl bg-linen/60 p-5">
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={uploadPct !== null}
              onClick={() => fileRef.current?.click()}
              className="btn btn-primary"
            >
              <Icon name="upload" />
              {uploadPct === null
                ? "Choose a video"
                : uploadPct < 100
                  ? "Uploading…"
                  : "Finishing…"}
            </button>
            <p className="mt-2 text-xs text-stone">
              Every spot is reviewed before it goes on air (usually within a day).
            </p>
            {uploadErr && <p className="mt-2 text-small text-barn">{uploadErr}</p>}
          </div>
        )}

        {mode === "ai" && (
          <div className="mt-5">
            <AdStudioWizard
              businessId={businessId}
              photos={photos}
              categorySlug={categorySlug}
              balance={balance}
              studioReady={studioReady}
            />
          </div>
        )}
      </section>
    </div>
  );
}
