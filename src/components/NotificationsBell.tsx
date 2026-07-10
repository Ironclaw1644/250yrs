"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { useMe } from "@/lib/useMe";
import { markNotificationsRead } from "@/lib/actions/notifications";

interface Item {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
}

const TYPE_ICON: Record<string, string> = {
  welcome: "flag",
  review_received: "star",
  owner_response: "comment",
  business_status: "store",
  subscription: "circle-check",
  video_status: "film",
  credits: "coins",
};

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** Header bell: gold unread badge, dropdown of the latest notifications. */
export function NotificationsBell() {
  const { me, refresh } = useMe();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    fetch("/api/me/notifications", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
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

  if (!me.signedIn) return null;

  async function markAll() {
    await markNotificationsRead();
    setItems((prev) => prev?.map((i) => ({ ...i, read_at: i.read_at ?? "now" })) ?? null);
    refresh();
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        aria-label={me.unread > 0 ? `Notifications (${me.unread} unread)` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 place-items-center rounded-full text-navy transition-colors duration-std ease-warm hover:bg-linen"
      >
        <Icon name="bell" className="text-lg" />
        {me.unread > 0 && (
          <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-barn px-1 text-[10px] font-bold text-cream">
            {me.unread > 9 ? "9+" : me.unread}
          </span>
        )}
      </button>

      <div
        className={`absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-xl border-[1.5px] border-navy/10 bg-paper-raised shadow-raised transition-all duration-std ease-warm ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-navy/10 px-4 py-3">
          <p className="font-sans text-small font-bold text-navy">Notifications</p>
          {me.unread > 0 && (
            <button
              type="button"
              onClick={markAll}
              className="font-sans text-xs font-bold text-barn hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <ul className="max-h-80 overflow-y-auto py-1">
          {items === null && (
            <li className="px-4 py-6 text-center text-small text-stone">Loading…</li>
          )}
          {items?.length === 0 && (
            <li className="px-4 py-6 text-center text-small text-stone">
              Nothing yet — we&apos;ll let you know.
            </li>
          )}
          {items?.map((n) => (
            <li key={n.id}>
              <Link
                href={n.href || "/account/notifications"}
                onClick={() => setOpen(false)}
                className={`flex gap-3 px-4 py-3 transition-colors hover:bg-linen ${
                  n.read_at ? "" : "bg-gold/10"
                }`}
              >
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy">
                  <Icon
                    name={TYPE_ICON[n.type] ?? "bell"}
                    className="text-xs text-gold"
                    fixedWidth
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-sans text-small font-bold text-navy">
                    {n.title}
                  </span>
                  {n.body && (
                    <span className="block truncate text-xs text-stone">{n.body}</span>
                  )}
                  <span className="block text-[11px] text-stone/80">
                    {timeAgo(n.created_at)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/account/notifications"
          onClick={() => setOpen(false)}
          className="block border-t border-navy/10 px-4 py-2.5 text-center font-sans text-small font-bold text-barn hover:underline"
        >
          View all
        </Link>
      </div>
    </div>
  );
}
