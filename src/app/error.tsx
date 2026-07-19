"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-[70vh] place-items-center px-6">
      <div className="max-w-md space-y-5 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-brand-gold/70">
          Something went sideways
        </p>
        <h1 className="font-display text-4xl text-brand-cream">
          That wasn&apos;t supposed to happen.
        </h1>
        <p className="text-white/60">
          Give it another try — your cart is safe.
        </p>
        <button type="button" onClick={reset} className="button-primary">
          Try again
        </button>
      </div>
    </main>
  );
}
