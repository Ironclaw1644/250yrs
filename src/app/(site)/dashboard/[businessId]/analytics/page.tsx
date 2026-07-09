import type { Metadata } from "next";
import { db } from "@/lib/supabase";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Analytics", robots: { index: false } };

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const svc = db();
  const [{ data: impressions }, { data: clicks }] = await Promise.all([
    svc
      .from("ad_impressions")
      .select("created_at")
      .eq("business_id", businessId)
      .gte("created_at", since.toISOString()),
    svc
      .from("ad_clicks")
      .select("created_at, action")
      .eq("business_id", businessId)
      .gte("created_at", since.toISOString()),
  ]);

  const imps = (impressions as { created_at: string }[]) ?? [];
  const clks = (clicks as { created_at: string; action: string | null }[]) ?? [];

  // group by day
  const days: { key: string; label: string; views: number; clicks: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      key: dayKey(d),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views: 0,
      clicks: 0,
    });
  }
  const byKey = new Map(days.map((d) => [d.key, d]));
  for (const r of imps) byKey.get(dayKey(new Date(r.created_at)))
    ? byKey.get(dayKey(new Date(r.created_at)))!.views++
    : null;
  for (const r of clks) byKey.get(dayKey(new Date(r.created_at)))
    ? byKey.get(dayKey(new Date(r.created_at)))!.clicks++
    : null;
  const max = Math.max(1, ...days.map((d) => d.views));

  const actionCounts = new Map<string, number>();
  for (const c of clks) {
    const a = c.action ?? "other";
    actionCounts.set(a, (actionCounts.get(a) ?? 0) + 1);
  }

  const KPIS = [
    { label: "Page views (30d)", value: imps.length, icon: "eye" },
    { label: "Calls", value: actionCounts.get("call") ?? 0, icon: "phone" },
    { label: "Directions", value: actionCounts.get("directions") ?? 0, icon: "location-dot" },
    { label: "Shares", value: actionCounts.get("share") ?? 0, icon: "share-nodes" },
  ];

  return (
    <div className="max-w-3xl">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label} className="card p-4">
            <div className="flex items-center justify-between">
              <span className="font-heading text-3xl font-bold text-navy">{k.value}</span>
              <Icon name={k.icon} className="text-gold" />
            </div>
            <p className="mt-1 font-heading text-xs font-semibold uppercase tracking-wide text-stone">
              {k.label}
            </p>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-heading text-h3 text-navy">Views by day</h2>
        {imps.length === 0 ? (
          <p className="mt-3 text-stone">
            No views tracked yet — once your page is live, you&apos;ll see how many
            people looked at it each day.
          </p>
        ) : (
          <div className="mt-4 flex h-40 items-end gap-[3px]">
            {days.map((d) => (
              <div
                key={d.key}
                title={`${d.label}: ${d.views} views`}
                className="flex-1 rounded-t bg-navy transition-colors hover:bg-barn"
                style={{ height: `${Math.max(3, (d.views / max) * 100)}%` }}
              />
            ))}
          </div>
        )}
        <p className="mt-2 text-small text-stone">Last 30 days</p>
      </div>
    </div>
  );
}
