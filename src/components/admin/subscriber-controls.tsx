"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setSubscriberStatus } from "@/lib/actions/admin";

export function SubscriberControls({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const subscribed = status === "subscribed";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setSubscriberStatus(id, subscribed ? "unsubscribed" : "subscribed");
          router.refresh();
        })
      }
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] uppercase tracking-wide transition ${
        subscribed
          ? "border-brand-gold/40 text-brand-gold hover:border-brand-rust hover:text-brand-rust"
          : "border-white/10 text-white/50 hover:text-brand-cream"
      }`}
    >
      {pending ? "…" : subscribed ? "Subscribed" : "Unsubscribed"}
    </button>
  );
}
