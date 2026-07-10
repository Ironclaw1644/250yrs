"use client";

import { useRef } from "react";
import { Icon } from "./Icon";
import { trackClick } from "@/lib/actions/customer";
import type { AdVideo } from "@/lib/queries";

/**
 * The business's TV commercial, presented like a spot on air: navy vignette
 * frame, gold ON AIR badge, and a real <video> player (poster only until the
 * visitor presses play — no bandwidth spent otherwise).
 */
export function TvSpot({
  businessId,
  video,
  isDemo,
}: {
  businessId: string;
  video: AdVideo;
  isDemo: boolean;
}) {
  const counted = useRef(false);

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2.5 font-heading text-h2 text-navy">
        <Icon name="tv" className="text-gold" /> TV Spot
        <span className="inline-flex items-center gap-1.5 rounded-full bg-barn px-2.5 py-0.5 font-sans text-xs font-bold uppercase tracking-wide text-cream">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cream" /> On air
        </span>
      </h2>
      <div className="relative overflow-hidden rounded-2xl bg-navy-deep p-2 shadow-raised sm:p-3">
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-gold/60" />
        <video
          controls
          preload="none"
          playsInline
          poster={video.thumbnail_url ?? undefined}
          onPlay={() => {
            if (counted.current || isDemo) return;
            counted.current = true;
            void trackClick(businessId, "video");
          }}
          className="aspect-video w-full rounded-xl bg-black object-contain"
        >
          <source src={video.url} />
          Your browser can&apos;t play this video.
        </video>
      </div>
    </section>
  );
}
