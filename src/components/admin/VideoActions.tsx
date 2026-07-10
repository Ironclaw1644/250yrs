"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setVideoStatus } from "@/lib/actions/admin";
import { useToast } from "./Toast";

/** Approve / reject controls for one TV spot in the moderation queue. */
export function VideoActions({
  videoId,
  hasUrl,
}: {
  videoId: string;
  hasUrl: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  function run(status: "ready" | "rejected") {
    start(async () => {
      const res = await setVideoStatus(videoId, status, reason || undefined);
      if (res.ok) toast("success", status === "ready" ? "Spot approved — on air." : "Spot rejected.");
      else toast("error", res.error ?? "Action failed.");
      setRejecting(false);
      setReason("");
      router.refresh();
    });
  }

  if (rejecting) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (sent to the owner)…"
          className="h-8 w-52 rounded-md border border-hairline bg-slate-2 px-2 text-xs text-cloud placeholder:text-mist/60 focus:border-gold focus:outline-none"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => run("rejected")}
          className="rounded bg-barn px-2 py-1 text-xs font-bold uppercase text-cloud disabled:opacity-50"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => setRejecting(false)}
          className="rounded bg-slate-2 px-2 py-1 text-xs uppercase text-mist"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending || !hasUrl}
        title={hasUrl ? "Approve — goes on air" : "Awaiting render — no video file yet"}
        onClick={() => run("ready")}
        className="rounded bg-success/20 px-2 py-1 text-xs font-semibold uppercase text-success hover:bg-success/30 disabled:opacity-40"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setRejecting(true)}
        className="rounded bg-barn/20 px-2 py-1 text-xs font-semibold uppercase text-[#e08a80] hover:bg-barn/30 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
