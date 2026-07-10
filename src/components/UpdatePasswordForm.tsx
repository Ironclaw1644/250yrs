"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Field } from "./AuthShell";
import { Icon } from "./Icon";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) return setErr("Use at least 8 characters.");
    if (password !== confirm) return setErr("The two passwords don't match.");
    setState("saving");
    const { error } = await createBrowserSupabase().auth.updateUser({ password });
    if (error) {
      setState("idle");
      setErr(error.message);
      return;
    }
    setState("done");
    router.refresh();
  }

  if (state === "done") {
    return (
      <div className="card flex items-center gap-3 p-6">
        <Icon name="circle-check" className="text-xl text-success" />
        <p className="text-char">Password updated. Use it next time you sign in.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <Field
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Field
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {err && <p className="rounded-md bg-barn/10 px-3 py-2 text-small text-barn">{err}</p>}
      <button type="submit" disabled={state === "saving"} className="btn btn-primary w-full">
        <Icon name="circle-check" /> {state === "saving" ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
