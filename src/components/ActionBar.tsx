"use client";

import { useState } from "react";
import { Icon } from "./Icon";

type Props = {
  name: string;
  phone?: string | null;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  demo?: boolean;
};

/** The action row from the logo mockup: Call · Directions · Save · Share.
 *  On DEMO listings, transactional actions become "Claim this business" (Fable P1). */
export function ActionBar({ name, phone, lat, lng, address, demo }: Props) {
  const [saved, setSaved] = useState(false);
  const [pop, setPop] = useState(false);

  const mapsQuery = encodeURIComponent(
    lat != null && lng != null ? `${lat},${lng}` : `${name} ${address ?? ""}`,
  );
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`;

  function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) navigator.share({ title: name, url }).catch(() => {});
    else navigator.clipboard?.writeText(url);
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
        <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="btn btn-primary">
          <Icon name="phone" /> Call Now
        </a>
      )}
      <a
        href={directions}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary"
      >
        <Icon name="location-dot" /> Directions
      </a>
      <button
        type="button"
        onClick={() => {
          setSaved((s) => !s);
          setPop(true);
          setTimeout(() => setPop(false), 350);
        }}
        aria-pressed={saved}
        className="btn btn-secondary"
      >
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
