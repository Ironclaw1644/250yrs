"use client";
import { createBrowserClient } from "@supabase/ssr";

/** Auth-aware Supabase client for Client Components (browser). */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: "taw" } },
  );
}
