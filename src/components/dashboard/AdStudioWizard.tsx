"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { submitAiVideo } from "@/lib/actions/videos";
import { AD_PRESETS, presetsForCategory, PRESET_BY_ID } from "@/lib/ad-presets";
import { VIDEO_COSTS, type AiStyle } from "@/lib/video-plans";
import type { StudioPhoto } from "./VideoStudio";

const STEPS = ["Style", "Photo", "Words", "Review"] as const;

/**
 * The guided Ad Studio: pick a style → add the one photo it needs → a tagline
 * → review and go. No free-form prompts, fixed lengths, one photo, hard
 * guidance at every step — built so a first-time owner gets a good ad on the
 * first try.
 */
export function AdStudioWizard({
  businessId,
  photos,
  categorySlug,
  balance,
  studioReady,
}: {
  businessId: string;
  photos: StudioPhoto[];
  categorySlug: string | null;
  balance: number;
  studioReady: boolean;
}) {
  const router = useRouter();
  const sorted = useMemo(() => presetsForCategory(categorySlug), [categorySlug]);

  const [step, setStep] = useState(0);
  const [presetId, setPresetId] = useState(sorted[0]?.id ?? AD_PRESETS[0].id);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [tagline, setTagline] = useState("");
  const [details, setDetails] = useState("");
  const [tier, setTier] = useState<AiStyle>(balance >= 3 ? "ai_premium" : "ai_motion");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const preset = PRESET_BY_ID[presetId] ?? AD_PRESETS[0];
  const slot = preset.slots[0];
  const cost = VIDEO_COSTS[tier];
  const canAfford = balance >= cost;

  const next = () => {
    setErr(null);
    if (step === 1 && !photoId) return setErr("Pick the photo for this ad first.");
    if (step === 2 && !tagline.trim()) return setErr("Give us one line — it shapes the whole ad.");
    setStep((s) => Math.min(3, s + 1));
  };

  function submit() {
    setErr(null);
    start(async () => {
      const res = await submitAiVideo(businessId, {
        style: tier,
        presetId,
        photoId: photoId!,
        tagline,
        details,
      });
      if (!res.ok) return setErr(res.error ?? "Something went wrong.");
      setDone(true);
      router.refresh();
    });
  }

  if (done) {
    return (
      <div className="rounded-xl bg-linen/60 p-6 text-center">
        <span className="pin-badge mx-auto h-14 w-14">
          <Icon name="circle-check" className="text-xl" />
        </span>
        <h3 className="mt-3 font-heading text-h3 text-navy">Your ad is in production</h3>
        <div className="mx-auto mt-4 max-w-sm space-y-1.5 text-left">
          {[
            ["Queued at the studio", true],
            ["Generating (usually 2–5 minutes)", true],
            ["Final human review", false],
            ["On air on your listing", false],
          ].map(([label, active]) => (
            <p key={label as string} className="flex items-center gap-2 text-small">
              <span
                className={`h-2 w-2 rounded-full ${active ? "bg-gold" : "bg-navy/20"}`}
              />
              <span className={active ? "font-semibold text-navy" : "text-stone"}>
                {label as string}
              </span>
            </p>
          ))}
        </div>
        <p className="mt-4 text-small text-stone">
          We&apos;ll notify you at each step — no need to wait here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-linen/60 p-5">
      {/* Progress */}
      <div className="mb-5 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => i < step && setStep(i)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-xs font-bold transition ${
              i === step
                ? "bg-navy text-gold"
                : i < step
                  ? "bg-gold/20 text-navy"
                  : "bg-navy/5 text-stone"
            }`}
          >
            {i < step && <Icon name="check" className="text-[9px]" />}
            {s}
          </button>
        ))}
      </div>

      {/* ===== Step 1: Style ===== */}
      {step === 0 && (
        <div className="space-y-3">
          <p className="font-sans text-small font-bold text-navy">
            Pick your ad style
            {categorySlug && (
              <span className="ml-2 font-normal text-stone">
                — best matches for your business are first
              </span>
            )}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {sorted.map((p) => {
              const match = categorySlug ? p.bestFor.includes(categorySlug) : false;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPresetId(p.id);
                    setPhotoId(null);
                  }}
                  className={`rounded-lg border-2 p-3.5 text-left transition-all duration-std ease-warm ${
                    presetId === p.id
                      ? "border-barn bg-paper-raised"
                      : "border-navy/15 bg-paper-raised/60 hover:border-barn/50"
                  }`}
                >
                  <p className="flex items-center justify-between font-sans font-bold text-navy">
                    <span>
                      <Icon name={p.icon} className="mr-2 text-gold" />
                      {p.name}
                    </span>
                    {match && (
                      <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-navy-deep">
                        FOR YOU
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-stone">{p.tagline}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== Step 2: Photo ===== */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="rounded-lg bg-paper-raised p-4">
            <p className="font-sans text-small font-bold text-navy">
              <Icon name="image" className="mr-1.5 text-gold" />
              {slot.label} — what we need
            </p>
            <p className="mt-1 text-small text-char">{slot.guidance}</p>
            <p className="mt-1 text-xs font-semibold text-stone">{slot.hint}</p>
          </div>

          {photos.length === 0 ? (
            <p className="text-small text-stone">
              No photos yet — add some in the <strong>Photos</strong> tab first, then come
              back. One great photo is all this ad needs.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {photos.map((p) => {
                const on = photoId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPhotoId(p.id)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      on
                        ? "border-gold ring-2 ring-gold/50"
                        : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                  >
                    <Image src={p.url} alt={p.alt_text ?? ""} fill sizes="140px" className="object-cover" />
                    {on && (
                      <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-gold text-navy-deep">
                        <Icon name="check" className="text-[10px]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-xs text-stone">
            <strong className="text-navy">Quick tips for a great ad:</strong> bright and
            sharp beats dark and blurry · fill the frame with the subject · landscape
            (wide) photos work best.
          </p>
        </div>
      )}

      {/* ===== Step 3: Words ===== */}
      {step === 2 && (
        <div className="space-y-4">
          <label className="block">
            <span className="font-sans text-small font-bold text-navy">
              Your tagline <span className="font-normal text-stone">(one line, required)</span>
            </span>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={60}
              placeholder='e.g. "The best fried chicken on Main Street since 1998"'
              className="mt-1 h-11 w-full rounded-md border-[1.5px] border-navy/15 bg-paper-raised px-3 text-navy placeholder:text-stone/60"
            />
            <span className="mt-1 block text-right text-xs text-stone">{tagline.length}/60</span>
          </label>
          <label className="block">
            <span className="font-sans text-small font-bold text-navy">
              Anything else? <span className="font-normal text-stone">(optional)</span>
            </span>
            <input
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={120}
              placeholder="Family-owned, 20 years in town, open late…"
              className="mt-1 h-11 w-full rounded-md border-[1.5px] border-navy/15 bg-paper-raised px-3 text-navy placeholder:text-stone/60"
            />
          </label>
          <p className="rounded-lg bg-paper-raised p-3 text-xs text-stone">
            <Icon name="circle-info" className="mr-1 text-gold" />
            We keep words <strong className="text-navy">off the video itself</strong> — AI-drawn
            text looks fake. Your tagline sets the mood and story of the ad instead.
          </p>
        </div>
      )}

      {/* ===== Step 4: Review ===== */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-lg bg-paper-raised p-4">
            {photoId && (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={photos.find((p) => p.id === photoId)?.url ?? ""}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-sans font-bold text-navy">
                <Icon name={preset.icon} className="mr-1.5 text-gold" />
                {preset.name}
              </p>
              <p className="truncate text-small italic text-stone">&ldquo;{tagline}&rdquo;</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(["ai_motion", "ai_premium"] as AiStyle[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTier(t)}
                className={`rounded-lg border-2 p-3.5 text-left transition-all duration-std ease-warm ${
                  tier === t
                    ? "border-barn bg-paper-raised"
                    : "border-navy/15 bg-paper-raised/60 hover:border-barn/50"
                }`}
              >
                <p className="flex items-center justify-between font-sans font-bold text-navy">
                  {t === "ai_motion" ? "Motion" : "Premium"}
                  <span className="rounded-full bg-navy px-2 py-0.5 text-[11px] font-bold text-gold">
                    {VIDEO_COSTS[t]} credit{VIDEO_COSTS[t] === 1 ? "" : "s"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-stone">
                  {t === "ai_motion"
                    ? "5 seconds · silent · brings your photo to life"
                    : "8 seconds · with sound · full cinematic commercial"}
                </p>
              </button>
            ))}
          </div>

          <p className="text-xs text-stone">
            Renders in 2–5 minutes, then our team gives it a quick review before it goes on
            air. If anything fails, your credits come straight back.
          </p>
        </div>
      )}

      {err && <p className="mt-3 text-small text-barn">{err}</p>}

      {/* Nav */}
      <div className="mt-5 flex items-center justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="font-sans text-small font-bold text-stone hover:text-navy"
          >
            ← Back
          </button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <button type="button" onClick={next} className="btn btn-primary">
            Continue <Icon name="arrow-right" />
          </button>
        ) : !studioReady ? (
          <p className="rounded-lg bg-paper-raised px-4 py-2.5 text-small text-stone">
            The studio is warming up — check back shortly.
          </p>
        ) : !canAfford ? (
          <p className="text-small text-barn">
            You need {cost} credit{cost === 1 ? "" : "s"} — grab a pack at the top of this page.
          </p>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="btn btn-primary disabled:opacity-60"
          >
            <Icon name="wand-magic-sparkles" />
            {pending ? "Sending to the studio…" : `Start production (${cost} credit${cost === 1 ? "" : "s"})`}
          </button>
        )}
      </div>
    </div>
  );
}
