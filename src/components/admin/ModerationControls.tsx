"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReviewStatus } from "@/lib/actions/admin";

const STATUSES = ["visible", "flagged", "hidden", "removed"] as const;

export function ModerationControls({
  reviewId,
  status,
}: {
  reviewId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) =>
        start(async () => {
          const res = await setReviewStatus(
            reviewId,
            e.target.value as (typeof STATUSES)[number],
          );
          if (!res.ok) alert(res.error ?? "Failed");
          router.refresh();
        })
      }
      className="h-8 rounded-md border border-hairline bg-slate-2 px-2 text-xs uppercase text-cloud focus:border-gold focus:outline-none"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
