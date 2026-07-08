import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client bound to the `taw` schema.
 *
 * Public pages are server-rendered, so we read published listings with the
 * SERVICE key (server-only — never shipped to the browser). RLS still governs
 * any client-side/authenticated access added in later phases via the anon key.
 *
 * NOTE: the `taw` schema must be added to the project's PostgREST "Exposed
 * schemas" for these requests to resolve (Supabase Dashboard → Settings → API).
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

let _client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY",
    );
  }
  if (!_client) {
    _client = createClient(url, serviceKey, {
      db: { schema: "taw" },
      auth: { persistSession: false, autoRefreshToken: false },
    }) as unknown as SupabaseClient;
  }
  return _client;
}

/** True when the DB is configured (used to degrade gracefully in previews). */
export const dbConfigured = Boolean(url && serviceKey);
