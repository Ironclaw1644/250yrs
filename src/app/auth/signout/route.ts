import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { authConfigured } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  if (authConfigured) {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
