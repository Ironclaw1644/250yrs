import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when browser/auth keys are present (public URL + publishable key). */
export const authConfigured = Boolean(url && key);

/**
 * Auth-aware Supabase client for Server Components / Server Actions / Route
 * Handlers. Uses the publishable (anon) key + cookies, so queries run as the
 * signed-in user under RLS. Bound to the `taw` schema.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(url!, key!, {
    db: { schema: "taw" },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // called from a Server Component render — safe to ignore; middleware refreshes.
        }
      },
    },
  });
}
