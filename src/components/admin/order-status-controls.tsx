"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setOrderStatus } from "@/lib/actions/admin";

const FLOW = ["pending", "confirmed", "fulfilled", "cancelled"] as const;

export function OrderStatusControls({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {FLOW.map((s) => (
        <button
          key={s}
          type="button"
          disabled={pending || s === status}
          onClick={() =>
            start(async () => {
              const res = await setOrderStatus(orderId, s);
              setMsg(res.ok ? `Marked ${s}.` : res.error ?? "Failed.");
              router.refresh();
            })
          }
          className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.14em] transition disabled:cursor-default ${
            s === status
              ? "border-brand-gold bg-brand-gold/15 text-brand-cream"
              : "border-white/10 text-white/60 hover:text-brand-cream disabled:opacity-40"
          }`}
        >
          {s}
        </button>
      ))}
      {msg && <span className="text-xs text-brand-gold">{msg}</span>}
    </div>
  );
}
