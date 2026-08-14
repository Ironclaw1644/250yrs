import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Site-wide payment hold. Flip to false (and redeploy) to bring the real
 * site back instantly — nothing else in this file or the app changes.
 */
const PAYMENT_HOLD_ACTIVE = false;
const HOLD_BYPASS_PREFIXES = ["/site-paused", "/api", "/_next", "/brand"];
const HOLD_BYPASS_EXACT = ["/favicon.ico", "/robots.txt", "/sitemap.xml"];

/**
 * Refreshes the Supabase auth session cookie on navigation.
 * GUARDED: if the publishable key isn't set, this no-ops so the public site
 * is never affected by an incomplete auth config.
 */
export async function middleware(request: NextRequest) {
  if (PAYMENT_HOLD_ACTIVE) {
    const { pathname } = request.nextUrl;
    const bypassed =
      HOLD_BYPASS_EXACT.includes(pathname) ||
      HOLD_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (!bypassed) {
      const holdUrl = request.nextUrl.clone();
      holdUrl.pathname = "/site-paused";
      return NextResponse.rewrite(holdUrl);
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  const response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals, the API, and static asset files.
    "/((?!_next/static|_next/image|favicon.ico|brand/|api/|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|xml)$).*)",
  ],
};
