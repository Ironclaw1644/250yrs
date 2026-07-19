"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCoupon, saveCoupon } from "@/lib/actions/admin";
import type { CouponRow } from "@/lib/store-types";

const inputCls =
  "w-full rounded-xl border border-white/12 bg-black/30 px-4 py-2.5 text-brand-cream placeholder:text-white/35 focus:border-brand-gold/60 focus:outline-none";

export function CouponForm({ coupon }: { coupon: CouponRow | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <form
      action={(fd) =>
        start(async () => {
          const res = await saveCoupon(coupon?.id ?? null, fd);
          setMsg(res.ok ? "Saved." : res.error ?? "Failed.");
          router.refresh();
        })
      }
      className="grid gap-3 rounded-2xl border border-white/8 bg-white/5 p-4 sm:grid-cols-6 sm:items-end"
    >
      <label className="grid gap-1 text-xs text-white/60">
        Code
        <input name="code" defaultValue={coupon?.code ?? ""} required className={inputCls} />
      </label>
      <label className="grid gap-1 text-xs text-white/60">
        Type
        <select name="discount_type" defaultValue={coupon?.discount_type ?? "percent"} className={inputCls}>
          <option value="percent">% off</option>
          <option value="fixed">$ off (cents)</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs text-white/60">
        Value
        <input name="discount_value" type="number" min="0" defaultValue={coupon?.discount_value ?? 10} className={inputCls} />
      </label>
      <label className="grid gap-1 text-xs text-white/60">
        Max uses
        <input name="max_redemptions" type="number" min="0" defaultValue={coupon?.max_redemptions ?? ""} className={inputCls} />
      </label>
      <label className="flex items-center gap-2 pb-2.5 text-sm text-white/70">
        <input type="checkbox" name="active" defaultChecked={coupon ? coupon.active : true} className="h-4 w-4 accent-[#c7a46a]" />
        Active
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="button-primary flex-1 disabled:opacity-60">
          {coupon ? "Save" : "Add"}
        </button>
        {coupon && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await deleteCoupon(coupon.id);
                router.refresh();
              })
            }
            className="rounded-full border border-white/10 px-4 text-xs uppercase text-white/50 hover:text-brand-rust"
          >
            Delete
          </button>
        )}
      </div>
      {msg && <p className="text-xs text-brand-gold sm:col-span-6">{msg}</p>}
    </form>
  );
}
