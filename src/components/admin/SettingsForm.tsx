"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { updateSiteSettings, uploadSiteImage } from "@/lib/actions/admin";

const IMAGE_SLOTS = [
  { slot: "home.hero", label: "Homepage hero background" },
  { slot: "advertise.panel", label: "Advertise panel photo" },
  { slot: "about.photo", label: "About page photo" },
];

export function SettingsForm({
  settings,
  images,
}: {
  settings: Record<string, string>;
  images: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  const inputCls =
    "h-10 w-full rounded-md border border-hairline bg-slate-2 px-3 text-small text-cloud placeholder:text-mist/60 focus:border-gold focus:outline-none";

  return (
    <div className="grid max-w-3xl gap-6">
      <form
        className="rounded-md border border-hairline bg-slate-1 p-5 shadow-admin-card"
        action={(fd) =>
          start(async () => {
            const res = await updateSiteSettings(fd);
            setMsg(res.ok ? "Settings saved." : (res.error ?? "Failed"));
            router.refresh();
          })
        }
      >
        <h2 className="font-heading text-h3">Contact & site info</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-mist">
              Contact email
            </span>
            <input name="contact_email" type="email" defaultValue={settings["site.contact_email"] ?? ""} placeholder="hello@trueamericanwear.com" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-mist">
              Contact phone
            </span>
            <input name="contact_phone" defaultValue={settings["site.contact_phone"] ?? ""} placeholder="(555) 555-0100" className={inputCls} />
          </label>
        </div>
        <button type="submit" disabled={pending} className="btn btn-gold mt-4 !min-h-9 px-4 text-small">
          <Icon name="check" /> Save settings
        </button>
        {msg && <p className="mt-2 text-small text-mist">{msg}</p>}
      </form>

      <div className="rounded-md border border-hairline bg-slate-1 p-5 shadow-admin-card">
        <h2 className="font-heading text-h3">Site images</h2>
        <p className="mt-1 text-small text-mist">
          Upload replaces the image everywhere it appears (JPG/PNG/WebP, max 6MB).
        </p>
        <ul className="mt-4 space-y-4">
          {IMAGE_SLOTS.map((s) => (
            <li key={s.slot} className="flex flex-wrap items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[`img.${s.slot}`] ?? placeholderFor(s.slot)}
                alt={s.label}
                className="h-16 w-24 rounded object-cover ring-1 ring-hairline"
              />
              <div className="min-w-0 flex-1">
                <p className="text-small font-semibold text-cloud">{s.label}</p>
                <form
                  action={(fd) =>
                    start(async () => {
                      const res = await uploadSiteImage(fd);
                      setMsg(res.ok ? "Image updated." : (res.error ?? "Upload failed"));
                      router.refresh();
                    })
                  }
                  className="mt-1 flex items-center gap-2"
                >
                  <input type="hidden" name="slot" value={s.slot} />
                  <input
                    type="file"
                    name="file"
                    accept="image/*"
                    className="text-xs text-mist file:mr-2 file:rounded file:border-0 file:bg-slate-2 file:px-2 file:py-1 file:text-xs file:text-cloud"
                  />
                  <button type="submit" disabled={pending} className="btn btn-gold !min-h-8 px-3 text-xs">
                    <Icon name="upload" /> Upload
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function placeholderFor(slot: string): string {
  if (slot === "home.hero") return "/images/hero/hero-1.webp";
  if (slot === "advertise.panel") return "/images/marketing/advertise-1.webp";
  return "/images/hero/hero-2.webp";
}
