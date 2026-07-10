"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { AuthShell, Field } from "@/components/AuthShell";
import { Icon } from "@/components/Icon";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const { error } = await createBrowserSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/account/password`,
    });
    setLoading(false);
    if (error) return setErr(error.message);
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="We sent you a reset link">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="pin-badge h-14 w-14">
            <Icon name="envelope" className="text-xl" />
          </span>
          <p className="text-char">
            If an account exists for <strong>{email}</strong>, a password-reset link is on
            its way. Click it to choose a new password.
          </p>
          <Link href="/login" className="btn btn-secondary">
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to set a new one"
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-barn underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {err && <p className="rounded-md bg-barn/10 px-3 py-2 text-small text-barn">{err}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          <Icon name="envelope" /> {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
