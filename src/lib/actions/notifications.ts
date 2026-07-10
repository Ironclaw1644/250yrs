"use server";

import { db } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";

/** Mark the caller's notifications read — specific ids, or all unread. */
export async function markNotificationsRead(
  ids?: string[],
): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };
  let q = db()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (ids?.length) q = q.in("id", ids);
  const { error } = await q;
  return { ok: !error };
}
