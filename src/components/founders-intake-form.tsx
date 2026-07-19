"use client";

import { useState } from "react";
import { joinWaitlist } from "@/lib/actions/waitlist";

type FoundersIntakeFormProps = {
  productName?: string;
  title?: string;
  description?: string;
  compact?: boolean;
};

/**
 * The founders list, now a real backend: writes to the subscribers table and
 * sends the FOUNDERS10 welcome email — no more mailto.
 */
export function FoundersIntakeForm({
  productName,
  title = "Join the list",
  description = "Be first in line for early access, product updates, and the first release.",
  compact = false,
}: FoundersIntakeFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState(productName ?? "250th Year Collection");
  const [company, setCompany] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setState("sending");
    const res = await joinWaitlist({ name, email, interest, company });
    if (!res.ok) {
      setState("idle");
      setErr(res.error);
      return;
    }
    setState("done");
  }

  if (state === "done") {
    return (
      <div className="rounded-[1.7rem] border border-brand-gold/25 bg-white/5 p-6 text-center sm:p-8">
        <p className="eyebrow">You&apos;re on the list</p>
        <h3 className="mt-2 font-display text-3xl text-brand-cream">Welcome to the founders list.</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/64">
          Check your inbox — your <span className="text-brand-gold">FOUNDERS10</span> welcome code
          is on its way.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.7rem] border border-white/8 bg-white/5 p-5 sm:p-6">
      <div className="space-y-2">
        <p className="eyebrow">Early access</p>
        <h3 className="font-display text-3xl text-brand-cream">{title}</h3>
        <p className="max-w-2xl text-sm leading-6 text-white/64">{description}</p>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={submit}>
        {/* Honeypot */}
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
        />
        <div className={`grid gap-4 ${compact ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          <label className="grid gap-2 text-sm text-white/70">
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-brand-cream outline-none transition placeholder:text-white/35 focus:border-brand-gold"
            />
          </label>

          <label className="grid gap-2 text-sm text-white/70">
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-brand-cream outline-none transition placeholder:text-white/35 focus:border-brand-gold"
            />
          </label>

          <label className="grid gap-2 text-sm text-white/70 md:col-span-2">
            <span>Interest</span>
            <input
              value={interest}
              onChange={(event) => setInterest(event.target.value)}
              placeholder="250th Year Collection / preorder / wholesale / early access"
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-brand-cream outline-none transition placeholder:text-white/35 focus:border-brand-gold"
            />
          </label>
        </div>

        {err && <p className="text-sm text-brand-rust">{err}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="button-primary disabled:opacity-60"
            disabled={state === "sending" || !email}
          >
            {state === "sending" ? "Joining…" : "Join now"}
          </button>
          <p className="text-xs text-white/40">10% welcome code, no spam, unsubscribe anytime.</p>
        </div>
      </form>
    </div>
  );
}
