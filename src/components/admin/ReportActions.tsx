"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveReport } from "@/lib/actions/admin";
import { useToast } from "./Toast";

/** Resolve / dismiss buttons for a single review report. */
export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();

  function run(resolution: "resolved" | "dismissed") {
    start(async () => {
      const res = await resolveReport(reportId, resolution);
      if (res.ok) toast("success", `Report ${resolution}.`);
      else toast("error", res.error ?? "Failed to update report.");
      router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => run("resolved")}
        className="rounded bg-success/20 px-2 py-1 text-xs font-semibold uppercase text-success hover:bg-success/30 disabled:opacity-50"
        title="Mark handled (after hiding/removing the review if needed)"
      >
        Resolve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run("dismissed")}
        className="rounded bg-slate-2 px-2 py-1 text-xs font-semibold uppercase text-mist hover:text-cloud disabled:opacity-50"
        title="Report doesn't need action"
      >
        Dismiss
      </button>
    </span>
  );
}
