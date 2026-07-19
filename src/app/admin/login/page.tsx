"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const { error } = await createBrowserSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) return setErr(error.message);
    router.replace("/admin");
    router.refresh();
  }

  const inputCls =
    "w-full rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-brand-cream placeholder:text-white/35 focus:border-brand-gold/60 focus:outline-none";

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="section-shell w-full max-w-sm space-y-6 text-center">
        <div className="relative mx-auto h-16 w-16">
          <Image src="/true-american-wear/logo.png" alt="True American Wear" fill className="object-contain" />
        </div>
        <div>
          <p className="eyebrow">Staff only</p>
          <h1 className="mt-1 font-display text-3xl text-brand-cream">Store admin</h1>
        </div>
        <form onSubmit={submit} className="space-y-4 text-left">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
          {err && <p className="text-sm text-brand-rust">{err}</p>}
          <button type="submit" disabled={loading} className="button-primary w-full text-center disabled:opacity-60">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
