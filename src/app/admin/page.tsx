import Link from "next/link";
import { db } from "@/lib/supabase";
import { Icon } from "@/components/Icon";
import { PageHeader, StatusPill, statusTone, EmptyState } from "@/components/admin/ui";

async function counts() {
  const svc = db();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weekAgo = new Date(Date.now() - weekMs).toISOString();
  const twoWeeksAgo = new Date(Date.now() - 2 * weekMs).toISOString();

  const head = (table: string) => svc.from(table).select("id", { count: "exact", head: true });

  const [pub, drafts, users, reviews, subsM, subsA, bizNew, bizPrev, userNew, userPrev, revNew, revPrev] =
    await Promise.all([
      head("businesses").eq("status", "published"),
      head("businesses").eq("status", "draft"),
      head("profiles"),
      head("reviews"),
      svc.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing"]).eq("plan_tier", "monthly"),
      svc.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing"]).eq("plan_tier", "annual"),
      head("businesses").gte("created_at", weekAgo),
      head("businesses").gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
      head("profiles").gte("created_at", weekAgo),
      head("profiles").gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
      head("reviews").gte("created_at", weekAgo),
      head("reviews").gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
    ]);

  const monthly = subsM.count ?? 0;
  const annual = subsA.count ?? 0;
  return {
    published: pub.count ?? 0,
    drafts: drafts.count ?? 0,
    users: users.count ?? 0,
    reviews: reviews.count ?? 0,
    subs: monthly + annual,
    mrr: monthly * 19.99 + annual * (100 / 12),
    trends: {
      businesses: { now: bizNew.count ?? 0, prev: bizPrev.count ?? 0 },
      users: { now: userNew.count ?? 0, prev: userPrev.count ?? 0 },
      reviews: { now: revNew.count ?? 0, prev: revPrev.count ?? 0 },
    },
  };
}

function Trend({ now, prev }: { now: number; prev: number }) {
  const up = now >= prev;
  return (
    <p className={`mt-1 flex items-center gap-1 text-xs ${up ? "text-success" : "text-mist"}`}>
      <Icon name={up ? "arrow-trend-up" : "arrow-trend-down"} className="text-[10px]" />
      +{now} this week{prev > 0 && ` (vs ${prev})`}
    </p>
  );
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

  const KPIS: {
    label: string;
    value: string | number;
    icon: string;
    href: string;
    trend?: { now: number; prev: number };
    sub?: string;
  }[] = [
    { label: "Live listings", value: k.published, icon: "store", href: "/admin/businesses?status=published", trend: k.trends.businesses },
    { label: "Drafts", value: k.drafts, icon: "pen-to-square", href: "/admin/businesses?status=draft" },
    { label: "Users", value: k.users, icon: "users", href: "/admin/users", trend: k.trends.users },
    { label: "Reviews", value: k.reviews, icon: "star", href: "/admin/reviews", trend: k.trends.reviews },
    { label: "Active subscriptions", value: k.subs, icon: "tag", href: "/admin/businesses" },
    {
      label: "Est. MRR",
      value: `$${k.mrr.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      icon: "coins",
      href: "/admin/businesses",
      sub: "monthly + annual÷12",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="What's happening across the directory this week."
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
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
            {kpi.trend && <Trend now={kpi.trend.now} prev={kpi.trend.prev} />}
            {kpi.sub && <p className="mt-1 text-xs text-mist/70">{kpi.sub}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-hairline bg-slate-1 p-5 shadow-admin-card">
          <h2 className="mb-4 font-heading text-h3">Recent businesses</h2>
          {(recentBiz ?? []).length === 0 ? (
            <EmptyState icon="store" title="No businesses yet" hint="New listings will appear here." />
          ) : (
            <ul className="divide-y divide-hairline">
              {((recentBiz as RecentBiz[]) ?? []).map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2.5">
                  <span className="truncate text-small">{b.name}</span>
                  <span className="ml-3 flex shrink-0 items-center gap-2">
                    {b.is_demo && <StatusPill tone="warn">demo</StatusPill>}
                    <StatusPill tone={statusTone(b.status)}>{b.status}</StatusPill>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-md border border-hairline bg-slate-1 p-5 shadow-admin-card">
          <h2 className="mb-4 font-heading text-h3">Recent reviews</h2>
          {(recentReviews ?? []).length === 0 ? (
            <EmptyState icon="star" title="No reviews yet" hint="Customer reviews will appear here." />
          ) : (
            <ul className="divide-y divide-hairline">
              {((recentReviews as unknown as RecentReview[]) ?? []).map((r) => (
                <li key={r.id} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-small font-semibold">{r.business?.name ?? "—"}</span>
                    <span className="ml-3 shrink-0 text-gold">{r.rating}★</span>
                  </div>
                  {r.body && <p className="mt-1 line-clamp-1 text-xs text-mist">{r.body}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
