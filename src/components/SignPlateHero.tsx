"use client";

import { useRef } from "react";

/** Hero enamel sign-plate with a subtle pointer-follow 3D tilt (desktop only). */
export function SignPlateHero({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${px * 5}deg`);
    el.style.setProperty("--rx", `${-py * 5}deg`);
  }
  function reset() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={reset}
      className="[perspective:1100px]"
    >
      <div
        ref={ref}
        className={`sign-plate sign-plate-3d px-6 py-10 sm:px-12 sm:py-14 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
