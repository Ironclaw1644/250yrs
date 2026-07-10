"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";

/**
 * Client-side auth chip so the public pages can stay statically cached
 * (no cookies() on the server). Shows "Sign in" until the browser confirms a
 * session, then "Account".
 */
export function HeaderAuth() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
    let active = true;
    // Lazy import keeps the supabase client out of the initial critical path.
    import("@/lib/supabase-browser").then(({ createBrowserSupabase }) => {
      const supabase = createBrowserSupabase();
      supabase.auth.getUser().then(({ data }) => {
        if (active) setSignedIn(Boolean(data.user));
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        if (active) setSignedIn(Boolean(session?.user));
      });
      return () => sub.subscription.unsubscribe();
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Link
      href={signedIn ? "/account" : "/login"}
      className="hidden items-center gap-1.5 font-sans font-bold text-navy hover:text-barn sm:inline-flex"
    >
      <Icon name={signedIn ? "circle-check" : "right-to-bracket"} />
      {signedIn ? "Account" : "Sign in"}
    </Link>
  );
}
