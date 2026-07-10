"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Editable } from "./Editable";
import { HeroFinder } from "./HeroFinder";
import { Icon } from "./Icon";
import { brand, CATEGORIES } from "@/lib/brand";
import type { GeoTree } from "@/lib/queries";

const POPULAR = [
  { label: "Fried Food", slug: "fried-food" },
  { label: "Hair Salon", slug: "hair-salons" },
  { label: "Barber Shop", slug: "barber-shops" },
  { label: "Tire Shop", slug: "tire-shops" },
  { label: "Fish Market", slug: "fish-markets" },
  { label: "Food Market", slug: "grocery-markets" },
];

// Deterministic ember field (no Math.random — keeps SSR/client markup identical)
const EMBERS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 61 + 7) % 100,
  bottom: 4 + ((i * 29) % 46),
  size: 3 + (i % 3) * 2,
  delay: (i % 8) * 1.1,
  duration: 7 + (i % 5) * 2.5,
}));

/**
 * The billboard hero: cinematic Ken Burns main street, drifting gold embers,
 * and the logo hung dead-center like a real enamel sign — cables, pointer-
 * tracked 3D tilt, breathing gold glow, and a shine sweep masked to the logo.
 */
export function HomeHero({ geo }: { geo: GeoTree }) {
  const tiltRef = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent) {
    const el = tiltRef.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - (r.left + r.width / 2)) / r.width;
    const py = (e.clientY - (r.top + r.height / 2)) / r.height;
    el.style.setProperty("--ry", `${Math.max(-1, Math.min(1, px)) * 10}deg`);
    el.style.setProperty("--rx", `${Math.max(-1, Math.min(1, -py)) * 8}deg`);
  }
  function onLeave() {
    const el = tiltRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <section
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative flex min-h-[88svh] flex-col justify-center overflow-hidden bg-navy-deep lg:min-h-[calc(100svh-6rem)]"
    >
      {/* Cinematic backdrop: slow Ken Burns drift */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/images/hero/hero-1.webp"
          alt="Small-town American main street at golden hour"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45 motion-safe:animate-[kenburns_26s_ease-in-out_infinite_alternate]"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/75 via-navy/50 to-navy-deep/95" />

      {/* Drifting gold embers */}
      {EMBERS.map((p, i) => (
        <span
          key={i}
          className="ember"
          style={{
            left: `${p.left}%`,
            bottom: `${p.bottom}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      <div className="container-shell relative py-14 lg:py-10">
        {/* ===== THE BILLBOARD (desktop) ===== */}
        <div className="hidden justify-center lg:flex">
          <div className="billboard-outer relative">
            {/* hanging cables */}
            <div className="absolute -top-24 left-1/2 flex w-[19rem] -translate-x-1/2 justify-between">
              <span className="h-24 w-[3px] rounded-full bg-gradient-to-b from-gold/0 via-gold/60 to-gold" />
              <span className="h-24 w-[3px] rounded-full bg-gradient-to-b from-gold/0 via-gold/60 to-gold" />
            </div>
            <div ref={tiltRef} className="billboard-tilt relative">
              {/* breathing spotlight */}
              <div
                className="absolute -inset-16 -z-10 motion-safe:animate-[glow-pulse_5s_ease-in-out_infinite]"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(240,168,24,0.35), rgba(240,168,24,0.12) 55%, transparent 75%)",
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.logo}
                alt={brand.name}
                className="w-[clamp(20rem,34vw,30rem)] drop-shadow-[0_30px_60px_rgba(6,18,29,0.65)]"
              />
              <span
                className="billboard-shine"
                style={{ "--logo-mask": `url(${brand.logo})` } as React.CSSProperties}
              />
            </div>
          </div>
        </div>

        {/* ===== Copy + finder ===== */}
        <div className="mt-0 max-w-3xl lg:mx-auto lg:mt-8 lg:max-w-4xl lg:text-center">
          <h1
            className="stamp reveal text-4xl leading-tight text-cream sm:text-5xl lg:text-[3.4rem]"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            <Editable id="copy.home.hero.headline">Find the Real Local Stores</Editable>
          </h1>
          <p
            className="stamp reveal mt-3 text-2xl italic text-gold sm:text-3xl"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <Editable id="copy.home.hero.subline">
              Food, Hair, Tires, Markets, and More.
            </Editable>
          </p>
          <p
            className="reveal mt-4 max-w-xl text-lead text-cloud/90 lg:mx-auto"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            <Editable id="copy.home.hero.support">
              Support local businesses in every city, every state, and around the world.
            </Editable>
          </p>
        </div>

        <div
          className="reveal mx-auto mt-8 lg:max-w-5xl"
          style={{ "--i": 4 } as React.CSSProperties}
        >
          <HeroFinder geo={geo} categories={CATEGORIES} />
        </div>

        <div
          className="reveal mt-5 flex flex-wrap items-center gap-2 lg:justify-center"
          style={{ "--i": 5 } as React.CSSProperties}
        >
          <span className="font-sans text-small font-bold text-cloud/80">Popular:</span>
          {POPULAR.map((p) => (
            <Link
              key={p.slug}
              href={`/categories/${p.slug}`}
              className="rounded-full border border-gold/50 bg-navy/60 px-3 py-1 text-small font-semibold text-cream transition-all duration-std ease-warm hover:-translate-y-0.5 hover:bg-gold hover:text-navy-deep"
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 lg:block">
        <span className="block animate-bounce text-gold/80">
          <Icon name="chevron-right" className="rotate-90 text-xl" />
        </span>
      </div>
    </section>
  );
}
