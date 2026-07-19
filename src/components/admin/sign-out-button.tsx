"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await createBrowserSupabase().auth.signOut();
        router.replace("/admin/login");
        router.refresh();
      }}
      className="block text-white/50 transition hover:text-brand-cream"
    >
      Sign out
    </button>
  );
}
