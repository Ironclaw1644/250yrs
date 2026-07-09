import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/supabase";

/** The signed-in user's favorited business ids (client-side saved-state). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ids: [] });
  const { data } = await db()
    .from("favorites")
    .select("business_id")
    .eq("customer_id", user.id);
  return NextResponse.json({
    ids: ((data as { business_id: string }[]) ?? []).map((r) => r.business_id),
  });
}
