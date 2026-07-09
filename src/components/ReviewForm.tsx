"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { submitReview } from "@/lib/actions/customer";

export function ReviewForm({ businessId }: { businessId: string }) {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setSignedIn(false);
      return;
    }
    import("@/lib/supabase-browser").then(({ createBrowserSupabase }) => {
      createBrowserSupabase()
        .auth.getUser()
        .then(({ data }) => setSignedIn(Boolean(data.user)));
    });
  }, []);

  if (signedIn === false) {
    return (
      <div className="card flex items-center justify-between gap-4 p-5">
        <p className="text-stone">Been here? Share your experience.</p>
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="btn btn-secondary !min-h-10 shrink-0 px-4 text-small"
        >
          <Icon name="right-to-bracket" /> Sign in to review
        </Link>
      </div>
    );
  }
  if (signedIn === null) return null;

  if (state === "done") {
    return (
      <div className="card flex items-center gap-3 p-5">
        <Icon name="circle-check" className="text-xl text-success" />
        <p className="text-char">Thanks — your review is live.</p>
      </div>
    );
  }

  return (
    <form
      className="card p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("saving");
        const res = await submitReview(businessId, rating, body, pathname);
        if (res.ok) setState("done");
        else {
          setState("error");
          setError(res.error ?? "Something went wrong.");
        }
      }}
    >
      <p className="font-heading text-h3 text-navy">Leave a review</p>
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="p-1"
          >
            <Icon
              name="star"
              className={`text-2xl transition-colors ${
                (hover || rating) >= n ? "text-gold" : "text-stone/30"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-small text-stone">{rating}/5</span>
        )}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="What did you order? How was the service?"
        className="mt-3 w-full rounded-md border-[1.5px] border-navy/15 bg-linen px-3 py-2 text-navy focus:border-success focus:outline-none focus:ring-4 focus:ring-gold/25"
      />
      {state === "error" && (
        <p className="mt-2 rounded-md bg-barn/10 px-3 py-2 text-small text-barn">{error}</p>
      )}
      <button
        type="submit"
        disabled={state === "saving" || rating === 0}
        className="btn btn-primary mt-3 disabled:opacity-50"
      >
        <Icon name="star" /> {state === "saving" ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}
