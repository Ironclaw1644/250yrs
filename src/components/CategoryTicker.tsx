import Link from "next/link";
import { Icon } from "./Icon";
import { CATEGORIES } from "@/lib/brand";

/** Painted-ticker marquee: category names gliding on a navy ribbon. */
export function CategoryTicker() {
  const items = CATEGORIES.map((c) => ({ label: c.name, slug: c.slug }));
  const strip = (keyPrefix: string) => (
    <div className="flex shrink-0 items-center" aria-hidden={keyPrefix === "b"}>
      {items.map((it) => (
        <span key={`${keyPrefix}-${it.slug}`} className="flex items-center">
          <Link
            href={`/categories/${it.slug}`}
            className="stamp px-5 text-lg italic text-cream/90 transition-colors hover:text-gold"
            tabIndex={keyPrefix === "b" ? -1 : undefined}
          >
            {it.label}
          </Link>
          <Icon name="star" className="text-[0.6rem] text-gold/70" />
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden border-y-2 border-gold/50 bg-navy py-3">
      <div className="marquee-track">
        {strip("a")}
        {strip("b")}
      </div>
      {/* soft edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-navy to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-navy to-transparent" />
    </div>
  );
}
