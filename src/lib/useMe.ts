"use client";

import { useCallback, useEffect, useState } from "react";
import type { Role } from "./auth-types";

export interface Me {
  signedIn: boolean;
  role: Role | null;
  displayName: string;
  initial: string;
  unread: number;
}

const SIGNED_OUT: Me = { signedIn: false, role: null, displayName: "", initial: "", unread: 0 };

// Module-level cache so AccountMenu, MobileNav, and NotificationsBell share one
// fetch per page load instead of racing three identical requests.
let cache: Me | null = null;
let inflight: Promise<Me> | null = null;
const listeners = new Set<(me: Me) => void>();

function broadcast(me: Me) {
  cache = me;
  listeners.forEach((l) => l(me));
}

async function fetchMe(): Promise<Me> {
  try {
    const res = await fetch("/api/me/summary", { cache: "no-store" });
    const data = await res.json();
    if (!data.signedIn) return SIGNED_OUT;
    const name: string = data.displayName || "Account";
    return {
      signedIn: true,
      role: data.role ?? "customer",
      displayName: name,
      initial: (name.trim()[0] || "A").toUpperCase(),
      unread: data.unreadNotifications ?? 0,
    };
  } catch {
    return SIGNED_OUT;
  }
}

function load(force = false): Promise<Me> {
  if (!force && cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetchMe().then((me) => {
      inflight = null;
      broadcast(me);
      return me;
    });
  }
  return inflight;
}

/**
 * Who is looking at the page. Starts signed-out on the server and the first
 * client paint (hydration-safe), then resolves once per page load; auth state
 * changes trigger a refetch for every subscriber.
 */
export function useMe(): { me: Me; loading: boolean; refresh: () => void } {
  const [me, setMe] = useState<Me>(cache ?? SIGNED_OUT);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    let active = true;
    listeners.add(setMe);
    load().then((m) => {
      if (active) {
        setMe(m);
        setLoading(false);
      }
    });

    let unsub: (() => void) | undefined;
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      import("@/lib/supabase-browser").then(({ createBrowserSupabase }) => {
        if (!active) return;
        const { data } = createBrowserSupabase().auth.onAuthStateChange((event) => {
          if (event === "SIGNED_IN" || event === "SIGNED_OUT") void load(true);
        });
        unsub = () => data.subscription.unsubscribe();
      });
    }
    return () => {
      active = false;
      listeners.delete(setMe);
      unsub?.();
    };
  }, []);

  const refresh = useCallback(() => {
    void load(true);
  }, []);

  return { me, loading, refresh };
}
