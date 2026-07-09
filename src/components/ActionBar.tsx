"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { toggleFavorite, trackClick } from "@/lib/actions/customer";

type Props = {
  businessId: string;
  name: string;
  phone?: string | null;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  demo?: boolean;
};

/** Call · Directions · Save · Share. Demo listings get "Claim this business". */
export function ActionBar({ businessId, name, phone, lat, lng, address, demo }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [saved, setSaved] = useState(false);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (demo || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
    fetch("/api/me/favorites")
      .then((r) => r.json())
      .then((d: { ids: string[] }) => setSaved(d.ids.includes(businessId)))
      .catch(() => {});
  }, [businessId, demo]);

  const mapsQuery = encodeURIComponent(
    lat != null && lng != null ? `${lat},${lng}` : `${name} ${address ?? ""}`,
  );
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`;

  function share() {
    if (!demo) void trackClick(businessId, "share");
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) navigator.share({ title: name, url }).catch(() => {});
    else navigator.clipboard?.writeText(url);
  }

  async function onSave() {
    setPop(true);
    setTimeout(() => setPop(false), 350);
    const res = await toggleFavorite(businessId);
    if ("signedOut" in res) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setSaved(res.saved);
  }

  if (demo) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="inline-flex items-center gap-2 rounded-md bg-gold/15 px-3 py-2 font-heading text-small font-semibold uppercase tracking-wide text-navy">
          <Icon name="circle-info" className="text-gold" /> Demo listing
        </span>
        <a href="/advertise" className="btn btn-gold">
          <Icon name="bullhorn" /> Is this your business? Claim it
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
      {phone && (
        <a
          href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
          onClick={() => void trackClick(businessId, "call")}
          className="btn btn-primary"
        >
          <Icon name="phone" /> Call Now
        </a>
      )}
      <a
        href={directions}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => void trackClick(businessId, "directions")}
        className="btn btn-secondary"
      >
        <Icon name="location-dot" /> Directions
      </a>
      <button type="button" onClick={onSave} aria-pressed={saved} className="btn btn-secondary">
        <Icon
          name="heart"
          className={`${saved ? "text-barn" : ""} ${pop ? "animate-pop-heart" : ""}`}
        />
        {saved ? "Saved" : "Save"}
      </button>
      <button type="button" onClick={share} className="btn btn-secondary">
        <Icon name="share-nodes" /> Share
      </button>
    </div>
  );
}
