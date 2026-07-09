"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

const PAGES = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/how-it-works", label: "How It Works" },
  { path: "/advertise", label: "Advertise" },
  { path: "/contact", label: "Contact" },
];

/**
 * Same-origin iframe canvas. The framed page detects it's inside the canvas
 * (EditableProvider) and turns every <Editable> into click-to-edit.
 */
export function EditCanvas() {
  const [path, setPath] = useState("/");

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 pb-4">
        {PAGES.map((p) => (
          <button
            key={p.path}
            type="button"
            onClick={() => setPath(p.path)}
            className={`rounded-full px-4 py-1.5 font-heading text-small font-semibold uppercase tracking-wide ${
              path === p.path
                ? "bg-gold text-navy-deep"
                : "bg-slate-1 text-mist hover:text-cloud"
            }`}
          >
            {p.label}
          </button>
        ))}
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 text-small text-mist hover:text-gold"
        >
          <Icon name="eye" /> Open live
        </a>
      </div>
      <p className="mb-3 rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-small text-cloud">
        <Icon name="pen-to-square" className="mr-1.5 text-gold" />
        Click any outlined text on the page below to edit it. Changes save when
        you click away and go live immediately.
      </p>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-hairline bg-paper shadow-admin-card">
        <iframe
          key={path}
          src={path}
          title={`Editing ${path}`}
          className="h-[75vh] w-full"
        />
      </div>
    </div>
  );
}
