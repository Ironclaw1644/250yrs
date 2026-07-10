"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { brand } from "@/lib/brand";

export interface AdminBadges {
  reviews?: number;
  videos?: number;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  badgeKey?: keyof AdminBadges;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "gauge-high", exact: true },
  { href: "/admin/businesses", label: "Businesses", icon: "store" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/reviews", label: "Reviews", icon: "star", badgeKey: "reviews" },
  { href: "/admin/videos", label: "TV Spots", icon: "film", badgeKey: "videos" },
  { href: "/admin/edit", label: "Edit Pages", icon: "pen-to-square" },
  { href: "/admin/settings", label: "Settings", icon: "gear" },
  { href: "/admin/audit", label: "Audit Log", icon: "clipboard-list" },
];

export function AdminShell({
  email,
  badges = {},
  children,
}: {
  email: string | null;
  badges?: AdminBadges;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        const badge = n.badgeKey ? badges[n.badgeKey] : undefined;
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-md px-3 py-2 font-heading text-small font-semibold uppercase tracking-wide transition-colors ${
              active
                ? "border-l-4 border-gold bg-slate-2 text-cloud"
                : "border-l-4 border-transparent text-mist hover:bg-slate-1 hover:text-cloud"
            }`}
          >
            <Icon name={n.icon} fixedWidth className={active ? "text-gold" : ""} />
            {n.label}
            {(badge ?? 0) > 0 && (
              <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold normal-case tracking-normal text-navy-deep">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-slate-1/60 p-4 lg:flex">
        <Link href="/admin" className="mb-6 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logo} alt={brand.name} className="h-10 w-auto" />
          <span className="mt-2 block font-heading text-xs font-semibold uppercase tracking-widest text-gold">
            Staff Portal
          </span>
        </Link>
        {nav}
        <div className="mt-auto space-y-2 pt-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-small text-mist hover:text-cloud"
          >
            <Icon name="house" fixedWidth /> Open site
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="flex items-center gap-2 text-small text-mist hover:text-cloud">
              <Icon name="right-to-bracket" fixedWidth /> Sign out
            </button>
          </form>
          {email && <p className="truncate text-xs text-mist/70">{email}</p>}
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-hairline bg-slate-1/60 px-4 py-3 lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logo} alt={brand.name} className="h-8 w-auto" />
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
            className="text-cloud"
          >
            <Icon name={open ? "xmark" : "bars"} className="text-xl" />
          </button>
        </div>
        {open && <div className="border-b border-hairline bg-slate-1 p-3 lg:hidden">{nav}</div>}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
