"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveSettings } from "@/lib/actions/admin";

const inputCls =
  "w-full rounded-xl border border-white/12 bg-black/30 px-4 py-2.5 text-brand-cream placeholder:text-white/35 focus:border-brand-gold/60 focus:outline-none";

const FIELDS: { key: string; label: string; placeholder: string; long?: boolean }[] = [
  { key: "site.announcement", label: "Announcement bar (blank = hidden)", placeholder: "Free US shipping over $125 — 250th Year Collection" },
  { key: "copy.home.hero.title", label: "Homepage hero headline", placeholder: "Wear the 250th." },
  { key: "copy.home.hero.subtitle", label: "Homepage hero subline", placeholder: "Limited numbered releases for America's 250th year.", long: true },
  { key: "copy.home.trust.1", label: "Trust strip — line 1", placeholder: "Limited numbered releases" },
  { key: "copy.home.trust.2", label: "Trust strip — line 2", placeholder: "10-year warranty on sets" },
  { key: "copy.home.trust.3", label: "Trust strip — line 3", placeholder: "Built for the 250th year" },
  { key: "copy.shop.hero.title", label: "Shop hero headline", placeholder: "Built for the 250th. Made to last well beyond it." },
  { key: "site.contact_email", label: "Contact email", placeholder: "orders@trueamericanwear.com" },
];

/** Editable site copy — the store's page text without touching code. */
export function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function parse(v: string | undefined): string {
    if (!v) return "";
    try {
      const p = JSON.parse(v);
      return typeof p === "string" ? p : v;
    } catch {
      return v;
    }
  }

  return (
    <form
      action={(fd) =>
        start(async () => {
          const res = await saveSettings(fd);
          setMsg(res.ok ? "Saved — the site updates within a minute." : res.error ?? "Failed.");
          router.refresh();
        })
      }
      className="max-w-2xl space-y-4 rounded-2xl border border-white/8 bg-white/5 p-5"
    >
      {FIELDS.map((f) => (
        <label key={f.key} className="grid gap-1.5 text-sm text-white/65">
          <span>{f.label}</span>
          {f.long ? (
            <textarea name={f.key} rows={2} defaultValue={parse(settings[f.key])} placeholder={f.placeholder} className={inputCls} />
          ) : (
            <input name={f.key} defaultValue={parse(settings[f.key])} placeholder={f.placeholder} className={inputCls} />
          )}
        </label>
      ))}
      {msg && <p className="text-sm text-brand-gold">{msg}</p>}
      <button type="submit" disabled={pending} className="button-primary disabled:opacity-60">
        {pending ? "Saving…" : "Save copy"}
      </button>
    </form>
  );
}
