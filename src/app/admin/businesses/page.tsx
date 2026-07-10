import Link from "next/link";
import { db } from "@/lib/supabase";
import { BusinessRowActions } from "@/components/admin/BusinessRowActions";
import { Icon } from "@/components/Icon";
import {
  PageHeader,
  StatusPill,
  statusTone,
  DataTable,
  PaginationControls,
} from "@/components/admin/ui";

type Row = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan_tier: string;
  featured_city: boolean;
  is_demo: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  category: { name: string; slug: string } | null;
  city: {
    name: string;
    slug: string;
    state: { code: string | null; name: string; slug: string; country: { slug: string } } | null;
  } | null;
};

const STATUSES = ["all", "published", "draft", "pending", "suspended", "archived"];
const PAGE_SIZE = 50;

export default async function AdminBusinesses({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = db()
    .from("businesses")
    .select(
      "id,name,slug,status,plan_tier,featured_city,is_demo,rating_avg,rating_count,created_at,category:categories(name,slug),city:cities(name,slug,state:states(code,name,slug,country:countries(slug)))",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (status && status !== "all") query = query.eq("status", status);
  if (q) query = query.ilike("name", `%${q.replace(/[%,()]/g, " ")}%`);
  const { data, count } = await query;
  const rows = (data as unknown as Row[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Businesses"
        subtitle="Every listing in the directory — publish, feature, or take down."
        actions={
          <form className="flex items-center gap-2" action="/admin/businesses" method="get">
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search name…"
              className="h-9 rounded-md border border-hairline bg-slate-1 px-3 text-small text-cloud placeholder:text-mist/60 focus:border-gold focus:outline-none"
            />
            {status && status !== "all" && <input type="hidden" name="status" value={status} />}
            <button type="submit" className="btn btn-gold !min-h-9 px-3 text-small">
              <Icon name="magnifying-glass" />
            </button>
          </form>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/businesses" : `/admin/businesses?status=${s}`}
            className={`rounded-full px-3 py-1 font-heading text-xs font-semibold uppercase tracking-wide ${
              (status ?? "all") === s
                ? "bg-gold text-navy-deep"
                : "bg-slate-1 text-mist hover:text-cloud"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <DataTable
        minWidth={900}
        columns={[
          { label: "Business" },
          { label: "Location" },
          { label: "Category" },
          { label: "Plan" },
          { label: "Rating" },
          { label: "Status" },
          { label: "Actions" },
        ]}
      >
        {rows.map((b) => {
          const st = b.city?.state;
          const publicPath =
            st?.country && b.city && b.category
              ? `/${st.country.slug}/${st.slug}/${b.city.slug}/${b.category.slug}/${b.slug}`
              : null;
          return (
            <tr key={b.id} className="hover:bg-slate-2/50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-cloud">{b.name}</span>
                  {b.is_demo && <StatusPill tone="warn">demo</StatusPill>}
                  {b.featured_city && <StatusPill tone="gold">featured</StatusPill>}
                </div>
                {publicPath && (
                  <Link href={publicPath} className="text-xs text-mist hover:text-gold" target="_blank">
                    view page ↗
                  </Link>
                )}
              </td>
              <td className="px-4 py-3 text-mist">
                {b.city ? `${b.city.name}, ${st?.code ?? st?.name ?? ""}` : "—"}
              </td>
              <td className="px-4 py-3 text-mist">{b.category?.name ?? "—"}</td>
              <td className="px-4 py-3 uppercase text-mist">{b.plan_tier}</td>
              <td className="px-4 py-3 text-mist">
                {b.rating_count > 0 ? `${b.rating_avg}★ (${b.rating_count})` : "—"}
              </td>
              <td className="px-4 py-3">
                <StatusPill tone={statusTone(b.status)}>{b.status}</StatusPill>
              </td>
              <td className="px-4 py-3">
                <BusinessRowActions id={b.id} status={b.status} featured={b.featured_city} />
              </td>
            </tr>
          );
        })}
        {!rows.length && (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-mist">
              No businesses match.
            </td>
          </tr>
        )}
      </DataTable>

      <PaginationControls
        page={page}
        pageSize={PAGE_SIZE}
        total={count ?? 0}
        basePath="/admin/businesses"
        params={{ q, status }}
      />
    </div>
  );
}
