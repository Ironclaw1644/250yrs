"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { useMe } from "@/lib/useMe";

/**
 * The header's auth corner. Signed out it's the same "Sign in" link the site
 * has always had; signed in it becomes an avatar chip with a warm dropdown of
 * everything that belongs to *you* — account, saved places, notifications,
 * your dashboard, and (for staff) the admin portal.
 */
export function AccountMenu() {
  const { me } = useMe();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on route change and on outside click / Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!me.signedIn) {
    return (
      <Link
        href="/login"
        className="hidden items-center gap-1.5 font-sans font-bold text-navy hover:text-barn sm:inline-flex"
      >
        <Icon name="right-to-bracket" />
        Sign in
      </Link>
    );
  }

  const items = [
    { href: "/account", label: "Your account", icon: "user" },
    { href: "/account/favorites", label: "Saved places", icon: "heart" },
    { href: "/account/notifications", label: "Notifications", icon: "bell", badge: me.unread },
    ...(me.role === "business_owner" || me.role === "admin"
      ? [{ href: "/dashboard", label: "Business dashboard", icon: "store" }]
      : []),
    // Staff portal is deliberately NOT in the menu — admins reach /admin
    // from the card on their account page.
  ];

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        aria-label={`Account menu for ${me.displayName}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid h-10 w-10 place-items-center rounded-full bg-navy font-sans text-lg font-bold text-gold shadow-sm ring-2 ring-gold/50 transition-all duration-std ease-warm hover:ring-gold"
      >
        {me.initial}
        {me.unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-barn px-1 text-[10px] font-bold text-cream">
            {me.unread > 9 ? "9+" : me.unread}
          </span>
        )}
      </button>

      <div
        className={`absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-xl border-[1.5px] border-navy/10 bg-paper-raised shadow-raised transition-all duration-std ease-warm ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <p className="truncate border-b border-navy/10 px-4 py-3 font-sans text-small font-bold text-navy">
          {me.displayName}
        </p>
        <ul className="py-1">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 font-sans text-small font-semibold text-char transition-colors hover:bg-linen hover:text-barn"
              >
                <Icon name={it.icon} fixedWidth className="text-stone" />
                {it.label}
                {"badge" in it && (it.badge ?? 0) > 0 && (
                  <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-navy-deep">
                    {it.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <form action="/auth/signout" method="post" className="border-t border-navy/10 p-1">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-small font-semibold text-char transition-colors hover:bg-linen hover:text-barn"
          >
            <Icon name="right-to-bracket" fixedWidth className="text-stone" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
