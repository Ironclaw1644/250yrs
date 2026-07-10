"use client";

import { useRef } from "react";

/** A soft gold spotlight that follows the cursor across a dark panel. */
export function Spotlight({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover)").matches) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${e.clientX - r.left}px`);
    el.style.setProperty("--sy", `${e.clientY - r.top}px`);
    el.style.setProperty("--so", "1");
  }
  function onLeave() {
    ref.current?.style.setProperty("--so", "0");
  }

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`relative ${className}`}>
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[var(--so,0)] transition-opacity duration-std"
        style={{
          background:
            "radial-gradient(340px circle at var(--sx,50%) var(--sy,50%), rgba(240,168,24,0.16), transparent 70%)",
        }}
      />
    </div>
  );
}
