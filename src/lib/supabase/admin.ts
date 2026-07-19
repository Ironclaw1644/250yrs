import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The store's ONLY data client (bondandfifth model): service-role key pinned
 * to the tenant schema. Every table is default-deny RLS, so the anon key can
 * never read store data — it is used solely for admin auth sessions.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

export const SCHEMA = process.env.SUPABASE_SCHEMA || "wear";
export const STORAGE_BUCKET = "wear-media";

export const dbConfigured = Boolean(url && serviceKey);

let _client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error("Supabase env missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY)");
  }
  if (!_client) {
    _client = createClient(url, serviceKey, {
      db: { schema: SCHEMA },
      auth: { persistSession: false, autoRefreshToken: false },
    }) as unknown as SupabaseClient;
  }
  return _client;
}

/** Public URL for an object in the store's media bucket. */
export function mediaPublicUrl(path: string): string {
  return `${url}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}
