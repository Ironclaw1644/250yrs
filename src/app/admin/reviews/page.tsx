import Link from "next/link";
import { db } from "@/lib/supabase";
import { ModerationControls } from "@/components/admin/ModerationControls";
import { ReportActions } from "@/components/admin/ReportActions";
import { Icon } from "@/components/Icon";
import {
  PageHeader,
  StatusPill,
  EmptyState,
  PaginationControls,
} from "@/components/admin/ui";
import { REPORT_REASONS } from "@/lib/report-reasons";

type ReviewRow = {
  id: string;
  rating: number;
  body: string | null;
  moderation_status: string;
  response_body: string | null;
  created_at: string;
  business: { name: string } | null;
  author: { full_name: string | null; email: string | null } | null;
};

type ReportRow = {
  id: string;
  reason: string;
  note: string | null;
  created_at: string;
  reporter: { full_name: string | null; email: string | null } | null;
  review: ReviewRow | null;
};

const TABS = [
  { key: "reported", label: "Reported" },
  { key: "flagged", label: "Flagged" },
  { key: "hidden", label: "Hidden" },
  { key: "all", label: "All" },
] as const;

const PAGE_SIZE = 25;

function ReviewCard({ r, children }: { r: ReviewRow; children?: React.ReactNode }) {
  return (
    <li className="rounded-md border border-hairline bg-slate-1 p-4 shadow-admin-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-cloud">
            {r.business?.name ?? "—"}
            <span className="ml-2 text-gold">{r.rating}★</span>
            {r.moderation_status !== "visible" && (
              <span className="ml-2">
                <StatusPill tone={r.moderation_status === "flagged" ? "warn" : "danger"}>
                  {r.moderation_status}
                </StatusPill>
              </span>
            )}
          </p>
          <p className="text-xs text-mist">
            {r.author?.full_name ?? r.author?.email ?? "anonymous"} ·{" "}
            {new Date(r.created_at).toLocaleDateString("en-US")}
          </p>
        </div>
        <ModerationControls reviewId={r.id} status={r.moderation_status} />
      </div>
      {r.body && <p className="mt-2 text-small text-cloud/90">{r.body}</p>}
      {r.response_body && (
        <p className="mt-2 rounded bg-slate-2 p-2 text-xs text-mist">
          <Icon name="comment" className="mr-1 text-gold" /> Owner: {r.response_body}
        </p>
      )}
      {children}
    </li>
  );
}

export default async function AdminReviews({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const { tab: tabParam, q, page: pageParam } = await searchParams;
  const tab = (TABS.find((t) => t.key === tabParam)?.key ?? "reported") as
    | "reported"
    | "flagged"
    | "hidden"
    | "all";
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const svc = db();

  // Tab counts
  const [openReports, flaggedC, hiddenC, allC] = await Promise.all([
    svc.from("review_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    svc.from("reviews").select("id", { count: "exact", head: true }).eq("moderation_status", "flagged"),
    svc.from("reviews").select("id", { count: "exact", head: true }).in("moderation_status", ["hidden", "removed"]),
    svc.from("reviews").select("id", { count: "exact", head: true }),
  ]);
  const counts: Record<string, number> = {
    reported: openReports.count ?? 0,
    flagged: flaggedC.count ?? 0,
    hidden: hiddenC.count ?? 0,
    all: allC.count ?? 0,
  };

  const safeQ = q?.replace(/[%,()]/g, " ").trim();

  let reports: ReportRow[] = [];
  let reviews: ReviewRow[] = [];
  let total = 0;

  if (tab === "reported") {
    let query = svc
      .from("review_reports")
      .select(
        "id,reason,note,created_at,reporter:profiles(full_name,email),review:reviews(id,rating,body,moderation_status,response_body,created_at,business:businesses!inner(name),author:profiles(full_name,email))",
        { count: "exact" },
      )
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (safeQ) query = query.ilike("review.business.name", `%${safeQ}%`);
    const { data, count } = await query;
    reports = (data as unknown as ReportRow[]) ?? [];
    total = count ?? 0;
  } else {
    let query = svc
      .from("reviews")
      .select(
        "id,rating,body,moderation_status,response_body,created_at,business:businesses!inner(name),author:profiles(full_name,email)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (tab === "flagged") query = query.eq("moderation_status", "flagged");
    if (tab === "hidden") query = query.in("moderation_status", ["hidden", "removed"]);
    if (safeQ) query = query.ilike("business.name", `%${safeQ}%`);
    const { data, count } = await query;
    reviews = (data as unknown as ReviewRow[]) ?? [];
    total = count ?? 0;
  }

  return (
    <div>
      <PageHeader
        title="Reviews"
        subtitle="You don't have to read every review — users report problems, and reports land here. Hiding or removing a review recomputes the business rating automatically."
        actions={
          <form className="flex items-center gap-2" action="/admin/reviews" method="get">
            <input type="hidden" name="tab" value={tab} />
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Filter by business…"
              className="h-9 rounded-md border border-hairline bg-slate-1 px-3 text-small text-cloud placeholder:text-mist/60 focus:border-gold focus:outline-none"
            />
            <button type="submit" className="btn btn-gold !min-h-9 px-3 text-small">
              <Icon name="magnifying-glass" />
            </button>
          </form>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "reported" ? "/admin/reviews" : `/admin/reviews?tab=${t.key}`}
            className={`rounded-full px-3 py-1 font-heading text-xs font-semibold uppercase tracking-wide ${
              tab === t.key ? "bg-gold text-navy-deep" : "bg-slate-1 text-mist hover:text-cloud"
            }`}
          >
            {t.label}
            <span className="ml-1.5 opacity-70">{counts[t.key]}</span>
          </Link>
        ))}
      </div>

      {tab === "reported" ? (
        reports.length === 0 ? (
          <EmptyState
            icon="circle-check"
            title="No open reports"
            hint="When users report a review, it shows up here for a decision."
          />
        ) : (
          <ul className="space-y-3">
            {reports.map((rep) =>
              rep.review ? (
                <ReviewCard key={rep.id} r={rep.review}>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded bg-barn/10 p-2.5">
                    <div className="min-w-0 text-xs">
                      <p className="font-semibold text-cloud">
                        <Icon name="flag" className="mr-1 text-barn" />
                        {REPORT_REASONS[rep.reason as keyof typeof REPORT_REASONS] ?? rep.reason}
                        <span className="ml-2 font-normal text-mist">
                          by {rep.reporter?.full_name ?? rep.reporter?.email ?? "anonymous"} ·{" "}
                          {new Date(rep.created_at).toLocaleDateString("en-US")}
                        </span>
                      </p>
                      {rep.note && <p className="mt-0.5 text-mist">&ldquo;{rep.note}&rdquo;</p>}
                    </div>
                    <ReportActions reportId={rep.id} />
                  </div>
                </ReviewCard>
              ) : null,
            )}
          </ul>
        )
      ) : reviews.length === 0 ? (
        <EmptyState
          icon="star"
          title={safeQ ? "Nothing matches" : "No reviews here"}
          hint={
            tab === "flagged"
              ? "Reviews you mark as flagged collect here for follow-up."
              : tab === "hidden"
                ? "Hidden and removed reviews are kept for the record."
                : "Customer reviews will appear here."
          }
        />
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} r={r} />
          ))}
        </ul>
      )}

      <PaginationControls
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        basePath="/admin/reviews"
        params={{ tab: tab === "reported" ? undefined : tab, q }}
      />
    </div>
  );
}
