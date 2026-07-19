"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatCents } from "@/lib/store-config";

export interface ShopGridItem {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  badge: string | null;
  priceCents: number;
  imageUrl: string | null;
  imageAlt: string;
  kind: "garments" | "sets";
  soldOut: boolean;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "garments", label: "Garments" },
  { key: "sets", label: "Sets" },
] as const;

/** The merged collection grid with filter chips (data comes from the DB). */
export function ShopGrid({ items }: { items: ShopGridItem[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const visible = filter === "all" ? items : items.filter((i) => i.kind === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-5 py-2 text-sm uppercase tracking-[0.18em] transition ${
              filter === f.key
                ? "border-brand-gold bg-brand-gold/15 text-brand-cream"
                : "border-white/10 text-white/70 hover:border-brand-gold/40 hover:text-brand-cream"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {visible.map((p) => (
          <article key={p.id} className="product-card group flex h-full flex-col overflow-hidden">
            <Link href={`/shop/${p.slug}`} className="relative block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1rem] border border-white/8 bg-black/30">
                {p.imageUrl && (
                  <Image
                    src={p.imageUrl}
                    alt={p.imageAlt}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                  />
                )}
              </div>
              {p.badge && (
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                  <span className="rounded-full border border-brand-gold/25 bg-black/55 px-3 py-1 text-[0.68rem] uppercase tracking-[0.24em] text-brand-cream/90">
                    {p.badge}
                  </span>
                </div>
              )}
              {p.soldOut && (
                <span className="absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1 text-[0.68rem] uppercase tracking-[0.24em] text-white/80">
                  Sold out
                </span>
              )}
            </Link>

            <div className="flex flex-1 flex-col space-y-4 p-5">
              <div className="space-y-2">
                <h3 className="font-display text-3xl text-brand-cream">{p.name}</h3>
                {p.subtitle && (
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-gold/75">
                    {p.subtitle}
                  </p>
                )}
                {p.description && (
                  <p className="text-sm leading-6 text-white/68 line-clamp-2">{p.description}</p>
                )}
              </div>
              <div className="mt-auto flex items-center justify-between gap-3">
                <p className="text-2xl font-semibold text-brand-cream">
                  {formatCents(p.priceCents)}
                </p>
                <Link href={`/shop/${p.slug}`} className="button-primary">
                  {p.kind === "sets" ? "Buy the set" : "Shop now"}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
