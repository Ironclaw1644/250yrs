"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fail-open scroll reveal: content starts VISIBLE, hides only when it is
 * genuinely below the fold after mount, and a safety timer guarantees it can
 * never be stranded invisible.
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
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return; // already on screen

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
