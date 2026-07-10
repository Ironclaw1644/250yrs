"use client";

import { useRef } from "react";

/**
 * Wraps a card in a subtle pointer-tracked 3D tilt with a specular sheen that
 * follows the cursor. Hover-capable pointers only — touch gets the plain card.
 */
export function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(px - 0.5) * 9}deg`);
    el.style.setProperty("--rx", `${(0.5 - py) * 9}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    el.style.setProperty("--sheen", "1");
  }
  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--sheen", "0");
  }

  return (
    <div className="[perspective:1000px]">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="relative rounded-lg transition-transform duration-std ease-warm [transform:perspective(1000px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] [transform-style:preserve-3d] motion-reduce:!transform-none"
      >
        {children}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg opacity-[var(--sheen,0)] transition-opacity duration-std"
          style={{
            background:
              "radial-gradient(220px circle at var(--mx,50%) var(--my,50%), rgba(247,194,74,0.22), transparent 65%)",
          }}
        />
      </div>
    </div>
  );
}
