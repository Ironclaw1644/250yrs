/** Client-safe TV-spot pricing metadata (no Stripe price ids or secrets). */

export const CREDIT_PACKS_INFO = {
  starter: { credits: 1, amountCents: 2900, label: "Starter", blurb: "1 credit" },
  pro: { credits: 3, amountCents: 6900, label: "Pro", blurb: "3 credits" },
  studio: { credits: 10, amountCents: 19900, label: "Studio", blurb: "10 credits" },
} as const;

export type CreditPack = keyof typeof CREDIT_PACKS_INFO;

/** What each AI production style costs, in credits. */
export const VIDEO_COSTS = { ai_motion: 1, ai_premium: 3 } as const;

export type AiStyle = keyof typeof VIDEO_COSTS;

export const STYLE_INFO: Record<
  AiStyle,
  { label: string; tagline: string; icon: string }
> = {
  ai_motion: {
    label: "Motion",
    tagline: "A polished slideshow spot built from your photos — music-video pacing, your name and tagline on screen.",
    icon: "image",
  },
  ai_premium: {
    label: "Premium AI",
    tagline: "A cinematic, TV-quality commercial generated for your business — camera moves, scenes, the works.",
    icon: "wand-magic-sparkles",
  },
};

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: cents % 100 ? 2 : 0,
  })}`;
}
