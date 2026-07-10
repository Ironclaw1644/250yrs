"use client";

import { useEffect, useState } from "react";

/** Thin gold reading-progress rail pinned under the sticky header. */
export function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="absolute inset-x-0 bottom-[-2px] h-[3px]" aria-hidden>
      <div
        className="h-full origin-left bg-gradient-to-r from-gold-deep via-gold to-gold-hi transition-[width] duration-75"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
