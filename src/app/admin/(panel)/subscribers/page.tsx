import { SubscriberControls } from "@/components/admin/subscriber-controls";
import { adminSubscribers } from "@/lib/admin-queries";

export default async function AdminSubscribersPage() {
  const subs = await adminSubscribers();
  const active = subs.filter((s) => s.status === "subscribed").length;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <p className="eyebrow">Subscribers</p>
        <h1 className="font-display text-4xl text-brand-cream">The founders list</h1>
        <p className="mt-1 text-sm text-white/50">
          {active} subscribed · {subs.length - active} unsubscribed
        </p>
      </div>

      {subs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-white/50">
          No subscribers yet — the Join-the-list forms feed this.
        </p>
      ) : (
        <ul className="divide-y divide-white/8 rounded-2xl border border-white/8 bg-white/5">
          {subs.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-brand-cream">{s.email}</p>
                <p className="truncate text-xs text-white/45">
                  {[s.name, s.source, new Date(s.created_at).toLocaleDateString("en-US")]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <SubscriberControls id={s.id} status={s.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
