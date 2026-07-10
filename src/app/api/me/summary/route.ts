import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Lightweight session summary for the header (account menu + notification
 * badge). Public pages stay statically cached; the browser asks who it is.
 */
export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ signedIn: false as const });
  }
  const { count } = await db()
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .is("read_at", null);
  return NextResponse.json({
    signedIn: true as const,
    role: profile.role,
    displayName: profile.display_name || profile.full_name || profile.email || "Account",
    unreadNotifications: count ?? 0,
  });
}
