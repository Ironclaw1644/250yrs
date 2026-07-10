import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { markNotificationsRead } from "@/lib/actions/notifications";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

const PAGE_SIZE = 20;

const TYPE_ICON: Record<string, string> = {
  welcome: "flag",
  review_received: "star",
  owner_response: "comment",
  business_status: "store",
  subscription: "circle-check",
  video_status: "film",
  credits: "coins",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUser("/account/notifications");
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const { data, count } = await db()
    .from("notifications")
    .select("id, type, title, body, href, read_at, created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const items = data ?? [];
  const total = count ?? 0;
  const unread = items.some((n) => !n.read_at);

  async function markAll() {
    "use server";
    await markNotificationsRead();
  }

  return (
    <div className="container-shell max-w-2xl py-8">
      <Link href="/account" className="text-small text-stone hover:text-barn">
        ← Your account
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-h1 text-navy">Notifications</h1>
        {unread && (
          <form action={markAll}>
            <button type="submit" className="btn btn-secondary !min-h-10 text-small">
              <Icon name="check" /> Mark all read
            </button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 p-10 text-center">
          <span className="pin-badge h-14 w-14">
            <Icon name="bell" className="text-xl" />
          </span>
          <p className="text-char">Nothing yet — reviews, replies, and updates will land here.</p>
          <Link href="/us" className="btn btn-secondary mt-2">
            <Icon name="magnifying-glass" /> Explore businesses
          </Link>
        </div>
      ) : (
        <ul className="card mt-6 divide-y divide-navy/10 !p-0">
          {items.map((n) => {
            const inner = (
              <div
                className={`flex gap-3 px-5 py-4 transition-colors ${
                  n.read_at ? "" : "bg-gold/10"
                } ${n.href ? "hover:bg-linen" : ""}`}
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy">
                  <Icon
                    name={TYPE_ICON[n.type] ?? "bell"}
                    className="text-small text-gold"
                    fixedWidth
                  />
                </span>
                <div className="min-w-0">
                  <p className="font-sans font-bold text-navy">{n.title}</p>
                  {n.body && <p className="text-small text-stone">{n.body}</p>}
                  <p className="mt-0.5 text-xs text-stone/80">
                    {new Date(n.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {!n.read_at && (
                  <span className="ml-auto mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-barn" />
                )}
              </div>
            );
            return (
              <li key={n.id}>
                {n.href ? <Link href={n.href}>{inner}</Link> : inner}
              </li>
            );
          })}
        </ul>
      )}

      {total > PAGE_SIZE && (
        <div className="mt-5 flex items-center justify-between">
          {page > 1 ? (
            <Link href={`?page=${page - 1}`} className="btn btn-secondary !min-h-10 text-small">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-small text-stone">
            Page {page} of {Math.ceil(total / PAGE_SIZE)}
          </span>
          {from + PAGE_SIZE < total ? (
            <Link href={`?page=${page + 1}`} className="btn btn-secondary !min-h-10 text-small">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
