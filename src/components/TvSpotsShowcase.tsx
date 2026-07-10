import Link from "next/link";
import { Icon } from "./Icon";

/**
 * Homepage TV-spots showcase: an ambient looping example commercial in a
 * gold-ringed TV frame, plus the Motion-vs-Premium comparison. Everything
 * autoplays muted (playsInline keeps iOS happy) — pure marketing, no
 * tracking, all assets static in /public/videos.
 */
export function TvSpotsShowcase() {
  return (
    <section className="bg-navy-deep py-14 text-cream sm:py-20">
      <div className="container-shell">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-sans text-eyebrow font-bold uppercase tracking-[0.1em] text-gold">
            <Icon name="tv" className="mr-1.5" /> TV Spots
          </p>
          <h2 className="stamp mt-3 text-3xl text-cream sm:text-4xl">
            Put your business on TV
          </h2>
          <p className="mt-3 text-lead text-cream/90">
            Every listing can run its own commercial — upload one, or let our studio
            make it for you. This is what one looks like:
          </p>
        </div>

        {/* The looping example commercial, framed like a set on air */}
        <div className="relative mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl bg-black p-2 shadow-raised sm:p-3">
          <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-2 ring-inset ring-gold/60" />
          <span className="absolute left-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full bg-barn px-2.5 py-0.5 font-sans text-xs font-bold uppercase tracking-wide text-cream">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cream" /> Example spot
          </span>
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/videos/example-premium-poster.jpg"
            className="aspect-video w-full rounded-xl object-cover"
          >
            <source src="/videos/example-premium.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Motion vs Premium comparison */}
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2">
          {[
            {
              label: "Motion",
              price: "1 credit · $29",
              blurb: "A polished spot built from your own photos — motion, music-video pacing, your brand front and center.",
              src: "/videos/example-motion.mp4",
              poster: "/videos/example-motion-poster.jpg",
              icon: "image",
            },
            {
              label: "Premium AI",
              price: "3 credits · from $69",
              blurb: "A cinematic, TV-quality commercial created for your business — camera moves, scenes, the works.",
              src: "/videos/example-premium.mp4",
              poster: "/videos/example-premium-poster.jpg",
              icon: "wand-magic-sparkles",
            },
          ].map((t) => (
            <div
              key={t.label}
              className="overflow-hidden rounded-xl border-2 border-gold/30 bg-navy transition-all duration-std ease-warm hover:border-gold/70"
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={t.poster}
                className="aspect-video w-full object-cover"
              >
                <source src={t.src} type="video/mp4" />
              </video>
              <div className="p-5">
                <p className="flex items-center justify-between font-sans font-bold text-cream">
                  <span>
                    <Icon name={t.icon} className="mr-2 text-gold" />
                    {t.label}
                  </span>
                  <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-navy-deep">
                    {t.price}
                  </span>
                </p>
                <p className="mt-2 text-small text-cream/90">{t.blurb}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-9 text-center">
          <Link href="/tv-spots" className="btn btn-gold">
            <Icon name="tv" /> See how TV Spots work
          </Link>
        </div>
      </div>
    </section>
  );
}
