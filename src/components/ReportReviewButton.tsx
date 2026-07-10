"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { reportReview } from "@/lib/actions/customer";
import { REPORT_REASONS, type ReportReason } from "@/lib/report-reasons";

/**
 * Quiet "Report" affordance on public review cards. Signed-in users pick a
 * reason (+ optional note); the report lands in the admin moderation queue.
 */
export function ReportReviewButton({
  reviewId,
  signedIn,
}: {
  reviewId: string;
  signedIn: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "done" | "already">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!signedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className="font-sans text-xs font-semibold text-stone/80 hover:text-barn"
      >
        <Icon name="flag" className="mr-1 text-[10px]" />
        Report
      </Link>
    );
  }

  if (state !== "idle") {
    return (
      <p className="font-sans text-xs font-semibold text-success">
        <Icon name="circle-check" className="mr-1" />
        {state === "already"
          ? "You already reported this review."
          : "Thanks — our team will take a look."}
      </p>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="font-sans text-xs font-semibold text-stone/80 hover:text-barn"
      >
        <Icon name="flag" className="mr-1 text-[10px]" />
        Report
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-72 rounded-xl border-[1.5px] border-navy/10 bg-paper-raised p-4 shadow-raised">
          <p className="font-sans text-small font-bold text-navy">Report this review</p>
          <div className="mt-2 space-y-1.5">
            {(Object.entries(REPORT_REASONS) as [ReportReason, string][]).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 text-small text-char">
                <input
                  type="radio"
                  name={`reason-${reviewId}`}
                  checked={reason === k}
                  onChange={() => setReason(k)}
                  className="h-3.5 w-3.5 accent-barn"
                />
                {label}
              </label>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything else we should know? (optional)"
            rows={2}
            className="mt-2 w-full rounded-md border-[1.5px] border-navy/15 bg-linen px-2 py-1.5 text-small text-navy placeholder:text-stone/60"
          />
          {err && <p className="mt-1 text-xs text-barn">{err}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-1.5 font-sans text-xs font-bold text-stone hover:text-navy"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setErr(null);
                  const res = await reportReview(reviewId, reason, note);
                  if (!res.ok) return setErr(res.error ?? "Something went wrong.");
                  setState(res.already ? "already" : "done");
                })
              }
              className="rounded-md bg-barn px-3 py-1.5 font-sans text-xs font-bold text-cream hover:bg-barn/90 disabled:opacity-60"
            >
              {pending ? "Sending…" : "Submit report"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
