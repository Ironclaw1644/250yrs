"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReviewStatus } from "@/lib/actions/admin";
import { Select } from "./Select";
import { useToast } from "./Toast";

const STATUSES = ["visible", "flagged", "hidden", "removed"] as const;

export function ModerationControls({
  reviewId,
  status,
}: {
  reviewId: string;
  status: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <Select
      defaultValue={status}
      disabled={pending}
      aria-label="Review status"
      onChange={(e) =>
        start(async () => {
          const value = e.target.value as (typeof STATUSES)[number];
          const res = await setReviewStatus(reviewId, value);
          if (res.ok) toast("success", `Review set to ${value}.`);
          else toast("error", res.error ?? "Failed to update review.");
          router.refresh();
        })
      }
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </Select>
  );
}
