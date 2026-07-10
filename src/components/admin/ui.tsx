import Link from "next/link";
import { Icon } from "@/components/Icon";

/* Shared admin primitives — one source of truth for the dark portal's chrome
   so every page reads as the same product. Server-safe (no hooks). */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-heading text-h1">{title}</h1>
        {subtitle && <p className="mt-1 text-small text-mist">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export type PillTone = "success" | "warn" | "danger" | "muted" | "gold";

const PILL_TONES: Record<PillTone, string> = {
  success: "bg-success/20 text-success",
  warn: "bg-gold/20 text-gold",
  danger: "bg-barn/25 text-[#e08a80]",
  muted: "bg-slate-2 text-mist",
  gold: "bg-gold text-navy-deep",
};

export function StatusPill({
  tone,
  children,
}: {
  tone: PillTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${PILL_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Maps a business/listing status string to a pill tone. */
export function statusTone(status: string): PillTone {
  if (status === "published" || status === "ready" || status === "active") return "success";
  if (status === "suspended" || status === "rejected" || status === "removed") return "danger";
  if (status === "pending" || status === "flagged" || status === "open") return "warn";
  return "muted";
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-hairline bg-slate-1/50 px-6 py-10 text-center">
      <Icon name={icon} className="text-2xl text-mist" />
      <p className="font-heading font-semibold text-cloud">{title}</p>
      {hint && <p className="text-small text-mist">{hint}</p>}
    </div>
  );
}

/** The shared table chrome: scroll container + styled thead. */
export function DataTable({
  columns,
  minWidth = 720,
  children,
}: {
  columns: { label: string; className?: string }[];
  minWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-hairline bg-slate-1 shadow-admin-card">
      <table className="w-full text-small" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-hairline text-left font-heading text-xs uppercase tracking-wide text-mist">
            {columns.map((c) => (
              <th key={c.label} className={`px-4 py-3 ${c.className ?? ""}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">{children}</tbody>
      </table>
    </div>
  );
}

/** Prev/Next pagination driven by ?page= (merges the given base params). */
export function PaginationControls({
  page,
  pageSize,
  total,
  basePath,
  params = {},
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (total <= pageSize) return null;
  const pages = Math.ceil(total / pageSize);
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn =
    "inline-flex items-center gap-1.5 rounded-md border border-hairline bg-slate-1 px-3 py-1.5 text-small font-semibold text-cloud transition-colors hover:bg-slate-2";
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={href(page - 1)} className={btn}>
          <Icon name="chevron-right" className="rotate-180 text-xs" /> Prev
        </Link>
      ) : (
        <span />
      )}
      <span className="text-small text-mist">
        Showing {from}–{to} of {total}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className={btn}>
          Next <Icon name="chevron-right" className="text-xs" />
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
