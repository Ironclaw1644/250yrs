"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";

const TABS = [
  { seg: "", label: "Overview", icon: "gauge-high" },
  { seg: "edit", label: "Details", icon: "pen-to-square" },
  { seg: "photos", label: "Photos", icon: "image" },
  { seg: "hours", label: "Hours", icon: "clock" },
  { seg: "menu", label: "Menu", icon: "utensils" },
  { seg: "services", label: "Services", icon: "list-check" },
  { seg: "coupons", label: "Coupons", icon: "tag" },
  { seg: "analytics", label: "Analytics", icon: "chart-line" },
  { seg: "advertise", label: "Advertise", icon: "bullhorn" },
];

export function OwnerTabs({ businessId }: { businessId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/${businessId}`;
  return (
    <nav className="mt-5 -mx-1 flex gap-1 overflow-x-auto border-b-2 border-navy/10 pb-px">
      {TABS.map((t) => {
        const href = t.seg ? `${base}/${t.seg}` : base;
        const active = t.seg ? pathname.startsWith(href) : pathname === base;
        return (
          <Link
            key={t.seg}
            href={href}
            className={`flex shrink-0 items-center gap-1.5 rounded-t-md px-3 py-2 font-sans text-small font-bold ${
              active
                ? "border-b-[3px] border-barn text-barn"
                : "text-stone hover:text-navy"
            }`}
          >
            <Icon name={t.icon} /> {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
