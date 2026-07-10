"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { useMe } from "@/lib/useMe";

const LINKS = [
  { href: "/us", label: "Find Businesses", icon: "magnifying-glass" },
  { href: "/tv-spots", label: "TV Spots", icon: "tv" },
  { href: "/how-it-works", label: "How It Works", icon: "circle-info" },
  { href: "/about", label: "About Us", icon: "flag" },
  { href: "/contact", label: "Contact", icon: "envelope" },
  { href: "/advertise", label: "Advertise", icon: "bullhorn" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { me } = useMe();

  // Close when the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const accountLinks = me.signedIn
    ? [
        { href: "/account", label: "Your Account", icon: "user", badge: 0 },
        { href: "/account/favorites", label: "Saved Places", icon: "heart", badge: 0 },
        { href: "/account/notifications", label: "Notifications", icon: "bell", badge: me.unread },
        ...(me.role === "business_owner" || me.role === "admin"
          ? [{ href: "/dashboard", label: "Business Dashboard", icon: "store", badge: 0 }]
          : []),
      ]
    : [{ href: "/login", label: "Sign In", icon: "right-to-bracket", badge: 0 }];

  const rows = [...LINKS.map((l) => ({ ...l, badge: 0 })), ...accountLinks];

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-11 w-11 place-items-center rounded-lg text-navy transition-colors duration-std ease-warm hover:bg-linen"
      >
        <span
          className={`inline-block transition-transform duration-std ease-warm ${
            open ? "rotate-90" : "rotate-0"
          }`}
        >
          <Icon name={open ? "xmark" : "bars"} className="text-xl" />
        </span>
        {me.unread > 0 && !open && (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-barn ring-2 ring-paper" />
        )}
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
              {rows.map((l, i) => (
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
                    {l.badge > 0 && (
                      <span className="ml-auto rounded-full bg-gold px-2.5 py-0.5 text-small font-bold text-navy-deep">
                        {l.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
              {me.signedIn && (
                <li
                  className={`transition-[opacity,transform] duration-std ease-warm ${
                    open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                  }`}
                  style={{ transitionDelay: open ? `${80 + rows.length * 45}ms` : "0ms" }}
                >
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 py-3.5 font-sans text-lg font-bold text-navy transition-colors hover:text-barn"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-navy">
                        <Icon name="right-to-bracket" className="text-small text-gold" fixedWidth />
                      </span>
                      Sign Out
                    </button>
                  </form>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
