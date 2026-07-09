import Link from "next/link";
import { db } from "@/lib/supabase";
import { BusinessRowActions } from "@/components/admin/BusinessRowActions";
import { Icon } from "@/components/Icon";

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

export default async function AdminBusinesses({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  let query = db()
    .from("businesses")
    .select(
      "id,name,slug,status,plan_tier,featured_city,is_demo,rating_avg,rating_count,created_at,category:categories(name,slug),city:cities(name,slug,state:states(code,name,slug,country:countries(slug)))",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (status && status !== "all") query = query.eq("status", status);
  if (q) query = query.ilike("name", `%${q.replace(/[%,()]/g, " ")}%`);
  const { data } = await query;
  const rows = (data as unknown as Row[]) ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-h1">Businesses</h1>
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
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
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

      <div className="mt-5 overflow-x-auto rounded-md border border-hairline bg-slate-1 shadow-admin-card">
        <table className="w-full min-w-[900px] text-small">
          <thead>
            <tr className="border-b border-hairline text-left font-heading text-xs uppercase tracking-wide text-mist">
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
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
                      {b.is_demo && (
                        <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gold">
                          demo
                        </span>
                      )}
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
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                        b.status === "published"
                          ? "bg-success/20 text-success"
                          : b.status === "suspended"
                            ? "bg-barn/20 text-barn"
                            : "bg-slate-2 text-mist"
                      }`}
                    >
                      {b.status}
                    </span>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
