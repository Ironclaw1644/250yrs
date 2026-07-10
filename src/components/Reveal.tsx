"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-triggered reveal — FAIL-OPEN by design.
 *
 * Content renders VISIBLE on the server and on first paint. Only after mount,
 * and only if the element is genuinely below the fold, do we hide it and let an
 * IntersectionObserver animate it in. A safety timer reveals it regardless.
 *
 * Why: an earlier version started at opacity:0 and depended on the observer to
 * ever fire. When it didn't (no JS, no IO, a stalled callback), the entire page
 * below the hero stayed permanently invisible. Never gate content on an effect.
 */
export function Reveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // Already on screen? Leave it visible — nothing to animate.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return;

    setHidden(true);
    const reveal = () => {
      setHidden(false);
      obs.disconnect();
      clearTimeout(safety);
    };
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(el);
    // Belt and braces: never leave content stranded.
    const safety = setTimeout(reveal, 4000);

    return () => {
      obs.disconnect();
      clearTimeout(safety);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-[opacity,transform] duration-[650ms] ease-warm motion-reduce:transition-none ${
        hidden ? "translate-y-8 opacity-0" : "translate-y-0 opacity-100"
      }`}
      style={delayMs && hidden ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
