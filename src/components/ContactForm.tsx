"use client";

import { useActionState } from "react";
import { submitContact, type ContactResult } from "@/lib/actions/contact";
import { Field } from "./AuthShell";
import { Icon } from "./Icon";
import { brand } from "@/lib/brand";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactResult | null, FormData>(
    submitContact,
    null,
  );

  if (state?.ok) {
    return (
      <div className="card flex items-center gap-3 p-6">
        <Icon name="circle-check" className="text-xl text-success" />
        <p className="text-char">
          Thanks — your message is on its way. We&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-4 p-6 sm:p-8">
      <Field label="Your name" name="name" required placeholder="Jane Smith" />
      <Field label="Email" name="email" type="email" required placeholder="you@example.com" />
      {/* honeypot */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="block">
        <span className="mb-1 block font-sans text-small font-bold text-navy">
          Message
        </span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="How can we help?"
          className="w-full rounded-md border-[1.5px] border-navy/15 bg-linen px-3 py-2 text-navy focus:border-success focus:outline-none focus:ring-4 focus:ring-gold/25"
        />
      </label>
      {state && !state.ok && state.error !== "unconfigured" && (
        <p className="rounded-md bg-barn/10 px-3 py-2 text-small text-barn">{state.error}</p>
      )}
      {state && !state.ok && state.error === "unconfigured" && (
        <p className="rounded-md bg-gold/15 px-3 py-2 text-small text-char">
          Our contact form is warming up — email us directly at{" "}
          <a href={`mailto:${brand.email}`} className="font-semibold text-barn underline">
            {brand.email}
          </a>
          .
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        <Icon name="envelope" /> {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
