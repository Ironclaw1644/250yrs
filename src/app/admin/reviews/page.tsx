import { db } from "@/lib/supabase";
import { ModerationControls } from "@/components/admin/ModerationControls";
import { Icon } from "@/components/Icon";

type Row = {
  id: string;
  rating: number;
  body: string | null;
  moderation_status: string;
  response_body: string | null;
  created_at: string;
  business: { name: string } | null;
  author: { full_name: string | null; email: string | null } | null;
};

export default async function AdminReviews() {
  const { data } = await db()
    .from("reviews")
    .select(
      "id,rating,body,moderation_status,response_body,created_at,business:businesses(name),author:profiles(full_name,email)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data as unknown as Row[]) ?? [];

  return (
    <div>
      <h1 className="font-heading text-h1">Reviews</h1>
      <p className="mt-1 text-small text-mist">
        Hiding or removing a review automatically recomputes the business rating.
      </p>
      <ul className="mt-5 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-md border border-hairline bg-slate-1 p-4 shadow-admin-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-cloud">
                  {r.business?.name ?? "—"}
                  <span className="ml-2 text-gold">{r.rating}★</span>
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
          </li>
        ))}
        {!rows.length && (
          <li className="rounded-md border border-hairline bg-slate-1 p-8 text-center text-mist">
            No reviews yet.
          </li>
        )}
      </ul>
    </div>
  );
}
