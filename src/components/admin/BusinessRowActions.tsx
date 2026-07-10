"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import {
  setBusinessStatus,
  setBusinessFeatured,
  deleteBusiness,
} from "@/lib/actions/admin";
import { useToast } from "./Toast";

export function BusinessRowActions({
  id,
  status,
  featured,
}: {
  id: string;
  status: string;
  featured: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, done: string) {
    start(async () => {
      const res = await fn();
      if (res.ok) toast("success", done);
      else toast("error", res.error ?? "Action failed");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {status !== "published" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setBusinessStatus(id, "published"), "Business published.")}
          className="rounded bg-success/20 px-2 py-1 text-xs font-semibold uppercase text-success hover:bg-success/30"
          title="Publish"
        >
          <Icon name="check" /> Publish
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setBusinessStatus(id, "suspended"), "Business suspended.")}
          className="rounded bg-barn/20 px-2 py-1 text-xs font-semibold uppercase text-barn hover:bg-barn/30"
          title="Suspend (takedown)"
        >
          <Icon name="ban" /> Suspend
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => setBusinessFeatured(id, !featured), featured ? "Removed from featured." : "Business featured.")}
        className={`rounded px-2 py-1 text-xs font-semibold uppercase ${
          featured
            ? "bg-gold/30 text-gold hover:bg-gold/40"
            : "bg-slate-2 text-mist hover:text-cloud"
        }`}
        title={featured ? "Remove featured" : "Feature in city"}
      >
        <Icon name="star" /> {featured ? "Featured" : "Feature"}
      </button>
      {confirming ? (
        <span className="inline-flex items-center gap-1">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => deleteBusiness(id), "Business deleted.")}
            className="rounded bg-barn px-2 py-1 text-xs font-bold uppercase text-cloud"
          >
            Confirm delete
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded bg-slate-2 px-2 py-1 text-xs uppercase text-mist"
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(true)}
          className="rounded bg-slate-2 px-2 py-1 text-xs font-semibold uppercase text-mist hover:text-barn"
          title="Delete"
        >
          <Icon name="trash" />
        </button>
      )}
    </div>
  );
}
