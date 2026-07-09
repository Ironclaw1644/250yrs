import Link from "next/link";
import { db } from "@/lib/supabase";
import { Icon } from "@/components/Icon";

async function counts() {
  const svc = db();
  const [pub, drafts, users, reviews, subs] = await Promise.all([
    svc.from("businesses").select("id", { count: "exact", head: true }).eq("status", "published"),
    svc.from("businesses").select("id", { count: "exact", head: true }).eq("status", "draft"),
    svc.from("profiles").select("id", { count: "exact", head: true }),
    svc.from("reviews").select("id", { count: "exact", head: true }),
    svc.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);
  return {
    published: pub.count ?? 0,
    drafts: drafts.count ?? 0,
    users: users.count ?? 0,
    reviews: reviews.count ?? 0,
    subs: subs.count ?? 0,
  };
}

type RecentBiz = { id: string; name: string; status: string; is_demo: boolean; created_at: string };
type RecentReview = { id: string; rating: number; body: string | null; created_at: string; business: { name: string } | null };

export default async function AdminDashboard() {
  const svc = db();
  const [k, { data: recentBiz }, { data: recentReviews }] = await Promise.all([
    counts(),
    svc.from("businesses").select("id,name,status,is_demo,created_at").order("created_at", { ascending: false }).limit(6),
    svc.from("reviews").select("id,rating,body,created_at,business:businesses(name)").order("created_at", { ascending: false }).limit(6),
  ]);

  const KPIS = [
    { label: "Live listings", value: k.published, icon: "store", href: "/admin/businesses?status=published" },
    { label: "Drafts", value: k.drafts, icon: "pen-to-square", href: "/admin/businesses?status=draft" },
    { label: "Users", value: k.users, icon: "users", href: "/admin/users" },
    { label: "Reviews", value: k.reviews, icon: "star", href: "/admin/reviews" },
    { label: "Active subscriptions", value: k.subs, icon: "tag", href: "/admin/businesses" },
  ];

  return (
    <div>
      <h1 className="font-heading text-h1">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {KPIS.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="rounded-md border border-hairline bg-slate-1 p-4 shadow-admin-card transition-colors hover:bg-slate-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-heading text-3xl font-bold text-cloud">{kpi.value}</span>
              <Icon name={kpi.icon} className="text-gold" />
            </div>
            <p className="mt-1 font-heading text-xs font-semibold uppercase tracking-wide text-mist">
              {kpi.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-hairline bg-slate-1 p-5 shadow-admin-card">
          <h2 className="mb-4 font-heading text-h3">Recent businesses</h2>
          <ul className="divide-y divide-hairline">
            {((recentBiz as RecentBiz[]) ?? []).map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2.5">
                <span className="truncate text-small">{b.name}</span>
                <span className="ml-3 flex shrink-0 items-center gap-2">
                  {b.is_demo && (
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold uppercase text-gold">demo</span>
                  )}
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
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-md border border-hairline bg-slate-1 p-5 shadow-admin-card">
          <h2 className="mb-4 font-heading text-h3">Recent reviews</h2>
          <ul className="divide-y divide-hairline">
            {((recentReviews as unknown as RecentReview[]) ?? []).map((r) => (
              <li key={r.id} className="py-2.5">
                <div className="flex items-center justify-between">
                  <span className="truncate text-small font-semibold">{r.business?.name ?? "—"}</span>
                  <span className="ml-3 shrink-0 text-gold">
                    {r.rating}★
                  </span>
                </div>
                {r.body && <p className="mt-1 line-clamp-1 text-xs text-mist">{r.body}</p>}
              </li>
            ))}
            {!(recentReviews ?? []).length && <li className="py-2 text-small text-mist">No reviews yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
