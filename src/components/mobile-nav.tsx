"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/shop", label: "Shop the Collection" },
  { href: "/#collection", label: "Featured Pieces" },
  { href: "/#campaign", label: "The Campaign" },
  { href: "/cart", label: "Your Cart" },
  { href: "/#founders-intake", label: "Join the List" },
];

/**
 * The mobile menu the site never had: hamburger + grid-rows 0fr→1fr dropdown
 * with staggered rows, closing on navigation. Obsidian glass styling.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid h-11 w-11 place-items-center rounded-full border border-white/12 text-brand-cream/85 transition hover:border-brand-gold/50 hover:text-brand-gold"
      >
        <span className={`inline-block transition-transform duration-std ease-warm ${open ? "rotate-90" : ""}`}>
          {open ? (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M3 6.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.25Zm0 3.75a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 10Zm.75 3a.75.75 0 0 0 0 1.5h12.5a.75.75 0 0 0 0-1.5H3.75Z" /></svg>
          )}
        </span>
      </button>

      <div
        className={`absolute inset-x-0 top-full z-50 grid border-b border-brand-gold/25 bg-brand-obsidian/95 backdrop-blur-xl transition-[grid-template-rows,opacity] duration-entrance ease-warm ${
          open ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <nav className="container-shell py-3">
            <ul className="divide-y divide-white/8">
              {LINKS.map((l, i) => (
                <li
                  key={l.href}
                  className={`transition-[opacity,transform] duration-std ease-warm ${
                    open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                  }`}
                  style={{ transitionDelay: open ? `${70 + i * 45}ms` : "0ms" }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block py-3.5 font-display text-xl text-brand-cream transition-colors hover:text-brand-gold"
                  >
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
