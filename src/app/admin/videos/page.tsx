import Link from "next/link";
import { db } from "@/lib/supabase";
import { VideoActions } from "@/components/admin/VideoActions";
import {
  PageHeader,
  StatusPill,
  statusTone,
  DataTable,
  EmptyState,
  PaginationControls,
} from "@/components/admin/ui";

type Row = {
  id: string;
  title: string | null;
  url: string | null;
  status: string;
  source: string;
  duration_seconds: number | null;
  credits_spent: number;
  brief: { tagline?: string; details?: string } | null;
  created_at: string;
  business: { name: string } | null;
};

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "all", label: "All" },
] as const;

const SOURCE_LABEL: Record<string, string> = {
  upload: "Upload",
  ai_motion: "Motion (AI)",
  ai_premium: "Premium (AI)",
};

const PAGE_SIZE = 50;

export default async function AdminVideos({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const { tab: tabParam, page: pageParam } = await searchParams;
  const tab = tabParam === "all" ? "all" : "pending";
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const svc = db();

  const [pendingC, allC] = await Promise.all([
    svc.from("business_videos").select("id", { count: "exact", head: true }).eq("status", "pending"),
    svc.from("business_videos").select("id", { count: "exact", head: true }),
  ]);
  const counts = { pending: pendingC.count ?? 0, all: allC.count ?? 0 };

  let query = svc
    .from("business_videos")
    .select(
      "id,title,url,status,source,duration_seconds,credits_spent,brief,created_at,business:businesses(name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (tab === "pending") query = query.eq("status", "pending");
  const { data, count } = await query;
  const rows = (data as unknown as Row[]) ?? [];

  return (
    <div>
      <PageHeader
        title="TV Spots"
        subtitle="Uploaded commercials need approval before they go on air; AI briefs wait here for the render worker."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "pending" ? "/admin/videos" : `/admin/videos?tab=${t.key}`}
            className={`rounded-full px-3 py-1 font-heading text-xs font-semibold uppercase tracking-wide ${
              tab === t.key ? "bg-gold text-navy-deep" : "bg-slate-1 text-mist hover:text-cloud"
            }`}
          >
            {t.label}
            <span className="ml-1.5 opacity-70">{counts[t.key]}</span>
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="film"
          title={tab === "pending" ? "Queue is clear" : "No spots yet"}
          hint="Uploaded videos and AI production briefs land here."
        />
      ) : (
        <DataTable
          minWidth={860}
          columns={[
            { label: "Business" },
            { label: "Spot" },
            { label: "Source" },
            { label: "Submitted" },
            { label: "Status" },
            { label: "Actions" },
          ]}
        >
          {rows.map((v) => (
            <tr key={v.id} className="align-top hover:bg-slate-2/50">
              <td className="px-4 py-3 font-semibold text-cloud">{v.business?.name ?? "—"}</td>
              <td className="px-4 py-3">
                <p className="text-cloud">{v.title ?? "Untitled spot"}</p>
                {v.brief?.tagline && (
                  <p className="mt-0.5 text-xs italic text-mist">&ldquo;{v.brief.tagline}&rdquo;</p>
                )}
                <p className="mt-0.5 text-xs text-mist">
                  {v.duration_seconds ? `${v.duration_seconds}s` : v.url ? "—" : "awaiting render"}
                  {v.url && (
                    <>
                      {" · "}
                      <a href={v.url} target="_blank" rel="noreferrer" className="text-gold hover:underline">
                        preview ↗
                      </a>
                    </>
                  )}
                </p>
              </td>
              <td className="px-4 py-3 text-mist">
                {SOURCE_LABEL[v.source] ?? v.source}
                {v.credits_spent > 0 && (
                  <span className="block text-xs">{v.credits_spent} credit{v.credits_spent === 1 ? "" : "s"}</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-mist">
                {new Date(v.created_at).toLocaleDateString("en-US")}
              </td>
              <td className="px-4 py-3">
                <StatusPill tone={statusTone(v.status)}>{v.status}</StatusPill>
              </td>
              <td className="px-4 py-3">
                {v.status === "pending" ? (
                  <VideoActions videoId={v.id} hasUrl={Boolean(v.url)} />
                ) : (
                  <span className="text-xs text-mist">—</span>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <PaginationControls
        page={page}
        pageSize={PAGE_SIZE}
        total={count ?? 0}
        basePath="/admin/videos"
        params={{ tab: tab === "pending" ? undefined : tab }}
      />
    </div>
  );
}
