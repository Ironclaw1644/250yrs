import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { notify } from "@/lib/notify";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";

/** Latest notifications + unread count for the header bell dropdown. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ items: [], unread: 0 });
  const svc = db();
  let [{ data }, { count }] = await Promise.all([
    svc
      .from("notifications")
      .select("id, type, title, body, href, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    svc
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);
  // Welcome fallback for sign-up paths that never hit /auth/callback.
  // The partial unique index makes this a no-op after the first time.
  if (!data?.length) {
    await notify({
      userId: user.id,
      type: "welcome",
      title: `Welcome to ${brand.name}!`,
      body: "Find real local businesses — food, hair, tires, markets, and more.",
      href: "/us",
    });
    [{ data }, { count }] = await Promise.all([
      svc
        .from("notifications")
        .select("id, type, title, body, href, read_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      svc
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null),
    ]);
  }
  return NextResponse.json({ items: data ?? [], unread: count ?? 0 });
}
