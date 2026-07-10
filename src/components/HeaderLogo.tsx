"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/brand";

/**
 * Nav logo that yields the spotlight to the homepage billboard:
 * on the desktop homepage it stays hidden until the visitor scrolls past the
 * hero, then glides in. Everywhere else (and on mobile) it's always shown.
 */
export function HeaderLogo() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // The homepage billboard owns the logo until you scroll past it.
  const yieldToBillboard = isHome && !scrolled;

  return (
    <Link
      href="/"
      className="justify-self-center transition-transform duration-std ease-warm hover:scale-[1.03]"
      aria-label={brand.name}
      tabIndex={yieldToBillboard ? -1 : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brand.logo}
        alt={brand.name}
        className={`h-20 w-auto transition-all duration-entrance ease-warm sm:h-[5.25rem] ${
          yieldToBillboard
            ? "pointer-events-none -translate-y-3 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      />
    </Link>
  );
}
