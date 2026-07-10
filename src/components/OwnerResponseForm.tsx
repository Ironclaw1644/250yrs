"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { respondToReview } from "@/lib/actions/customer";

export function OwnerResponseForm({ reviewId }: { reviewId: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 font-sans text-small font-bold text-navy hover:text-barn"
      >
        <Icon name="comment" /> Respond as owner
      </button>
    );
  }

  return (
    <form
      className="mt-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await respondToReview(reviewId, body, pathname);
        setSaving(false);
        if (!res.ok) setError(res.error ?? "Could not save.");
        else setOpen(false);
      }}
    >
      <textarea
        autoFocus
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder="Thank the customer or address their feedback…"
        className="w-full rounded-md border-[1.5px] border-navy/15 bg-linen px-3 py-2 text-small text-navy focus:border-success focus:outline-none"
      />
      {error && <p className="mt-1 text-small text-barn">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button type="submit" disabled={saving || !body.trim()} className="btn btn-gold !min-h-9 px-3 text-small disabled:opacity-50">
          {saving ? "Saving…" : "Post response"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary !min-h-9 px-3 text-small">
          Cancel
        </button>
      </div>
    </form>
  );
}
