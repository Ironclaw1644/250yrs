"use client";

import { useState } from "react";
import Link from "next/link";
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
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid h-10 w-10 place-items-center rounded-md text-navy"
      >
        <Icon name={open ? "xmark" : "bars"} className="text-xl" />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-b-2 border-gold/40 bg-paper shadow-raised">
          <nav className="container-shell py-3">
            <ul className="divide-y divide-navy/10">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 py-3 font-heading font-semibold uppercase tracking-wide text-navy"
                  >
                    <Icon name={l.icon} className="text-gold" fixedWidth />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
