"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const LINKS = [
  { href: "/us", label: "Find Businesses", icon: "magnifying-glass" },
  { href: "/how-it-works", label: "How It Works", icon: "circle-info" },
  { href: "/about", label: "About Us", icon: "flag" },
  { href: "/contact", label: "Contact", icon: "envelope" },
  { href: "/advertise", label: "Advertise", icon: "bullhorn" },
  { href: "/login", label: "Sign In", icon: "right-to-bracket" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close when the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid h-11 w-11 place-items-center rounded-lg text-navy transition-colors duration-std ease-warm hover:bg-linen"
      >
        <span
          className={`inline-block transition-transform duration-std ease-warm ${
            open ? "rotate-90" : "rotate-0"
          }`}
        >
          <Icon name={open ? "xmark" : "bars"} className="text-xl" />
        </span>
      </button>

      {/* Smooth drop-down: grid-rows 0fr -> 1fr height animation + fade/slide */}
      <div
        className={`absolute inset-x-0 top-full z-50 grid border-b-2 border-gold/40 bg-paper shadow-raised transition-[grid-template-rows,opacity] duration-entrance ease-warm ${
          open ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <nav className="container-shell py-3">
            <ul className="divide-y divide-navy/10">
              {LINKS.map((l, i) => (
                <li
                  key={l.href}
                  className={`transition-[opacity,transform] duration-std ease-warm ${
                    open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                  }`}
                  style={{ transitionDelay: open ? `${80 + i * 45}ms` : "0ms" }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 py-3.5 font-sans text-lg font-bold text-navy transition-colors hover:text-barn"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-navy">
                      <Icon name={l.icon} className="text-small text-gold" fixedWidth />
                    </span>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
