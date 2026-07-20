/**
 * Ad Studio presets — the rails that make a first-time owner's ad look
 * professional. Each preset fixes the creative direction (camera, mood,
 * pacing) and tells the owner exactly which photo to bring. No free-form
 * prompts anywhere: the owner picks a style, adds photos + a tagline, and
 * the prompt is assembled server-side.
 *
 * Client-safe: no secrets, imported by the wizard UI and the server action.
 */

export interface PhotoSlot {
  key: string;
  label: string;
  /** What to shoot — shown under the upload slot. */
  guidance: string;
  /** One-line do/don't. */
  hint: string;
  required: boolean;
}

export interface AdPreset {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  /** Category slugs this preset suits best — used to sort/preselect. */
  bestFor: string[];
  slots: PhotoSlot[];
  /**
   * Scene direction merged with {business}, {city}, {tagline}, {details}.
   * Text-on-screen is explicitly forbidden — AI-rendered text looks fake.
   */
  scene: string;
}

const NO_TEXT =
  "No on-screen text, no captions, no subtitles, no logos, no watermarks. " +
  "Photorealistic, professional TV-commercial cinematography, smooth stabilized camera.";

export const AD_PRESETS: AdPreset[] = [
  {
    id: "storefront-hero",
    name: "Storefront Hero",
    tagline: "A cinematic golden-hour arrival at your front door.",
    icon: "store",
    bestFor: ["local-shops", "clothing-stores", "beauty-supply", "grocery-markets", "bakeries"],
    slots: [
      {
        key: "storefront",
        label: "Your storefront",
        guidance:
          "Stand across the street in daylight. Get the whole front in frame — sign, door, windows.",
        hint: "Do: straight-on, sunny. Don't: cars or people blocking the entrance.",
        required: true,
      },
    ],
    scene:
      "Cinematic dolly-in toward the storefront of {business} in {city} at golden hour, " +
      "warm sunlight raking across the facade, gentle lens flare, the entrance glowing and inviting, " +
      "a welcoming neighborhood feeling. Mood: {tagline}. {details} " +
      NO_TEXT,
  },
  {
    id: "food-sizzle",
    name: "Food Sizzle",
    tagline: "Steam, crunch, and close-ups that make people hungry.",
    icon: "utensils",
    bestFor: ["fried-food", "soul-food", "food-trucks", "bakeries", "fish-markets"],
    slots: [
      {
        key: "dish",
        label: "Your best dish",
        guidance:
          "One plate, up close, in natural light. Fill the whole frame with the food.",
        hint: "Do: fresh off the line, steam visible. Don't: dim lighting or clutter behind the plate.",
        required: true,
      },
    ],
    scene:
      "Mouth-watering macro food commercial of the signature dish at {business} in {city}: " +
      "slow push-in, rising steam, glistening textures, a fork lifting a perfect bite in slow motion, " +
      "shallow depth of field, warm appetizing color grade. Mood: {tagline}. {details} " +
      NO_TEXT,
  },
  {
    id: "fresh-cut",
    name: "The Fresh Cut",
    tagline: "Chair spin, clean fade, confident smile.",
    icon: "scissors",
    bestFor: ["barber-shops", "hair-salons"],
    slots: [
      {
        key: "chair",
        label: "Your chair or a finished cut",
        guidance:
          "Either your station (chair + mirror, lights on) or a customer's finished look.",
        hint: "Do: tidy station, bright bulbs. Don't: mid-cut mess or harsh phone flash.",
        required: true,
      },
    ],
    scene:
      "Stylish barbershop commercial at {business} in {city}: a client spins toward the mirror " +
      "revealing a crisp fresh cut, confident smile, clippers resting on the station, warm bulbs " +
      "glowing, upbeat neighborhood energy. Mood: {tagline}. {details} " +
      NO_TEXT,
  },
  {
    id: "on-the-road",
    name: "On the Road",
    tagline: "Wheels turning, engines humming, back on the road fast.",
    icon: "car",
    bestFor: ["tire-shops", "repair-shops", "car-washes"],
    slots: [
      {
        key: "bay",
        label: "Your shop bay or a vehicle",
        guidance:
          "The service bay with a car on the lift, or a clean vehicle out front of the shop.",
        hint: "Do: work lights on, tools tidy. Don't: empty dark garage.",
        required: true,
      },
    ],
    scene:
      "Confident auto-service commercial at {business} in {city}: a wheel spins into place, " +
      "an impact wrench flashes, the car rolls out of the bay into sunlight looking brand new, " +
      "chrome glints, satisfying motion. Mood: {tagline}. {details} " +
      NO_TEXT,
  },
  {
    id: "market-fresh",
    name: "Market Fresh",
    tagline: "A cascade of fresh goods your neighbors can't resist.",
    icon: "basket-shopping",
    bestFor: ["grocery-markets", "fish-markets", "bakeries", "food-trucks"],
    slots: [
      {
        key: "display",
        label: "Your best display",
        guidance:
          "Your freshest shelf, case, or produce stand — stocked and colorful.",
        hint: "Do: full shelves, bright colors. Don't: half-empty displays.",
        required: true,
      },
    ],
    scene:
      "Vibrant fresh-market commercial at {business} in {city}: slow glide along an overflowing " +
      "display, rich colors, a hand picking the perfect item, light mist on fresh produce, " +
      "abundant and inviting. Mood: {tagline}. {details} " +
      NO_TEXT,
  },
  {
    id: "grand-opening",
    name: "Grand Opening Energy",
    tagline: "Big-moment excitement for any business, any day.",
    icon: "bullhorn",
    bestFor: ["nightclubs", "local-shops", "clothing-stores", "beauty-supply"],
    slots: [
      {
        key: "hero",
        label: "Your best photo",
        guidance:
          "Your favorite shot of the business — storefront, interior, or product. Make it the one you'd put on a billboard.",
        hint: "Do: sharp and bright. Don't: blurry or sideways photos.",
        required: true,
      },
    ],
    scene:
      "High-energy celebration commercial for {business} in {city}: dramatic reveal push-in, " +
      "warm lights blooming on, a feeling of doors opening and the neighborhood showing up, " +
      "festive and proud. Mood: {tagline}. {details} " +
      NO_TEXT,
  },
];

export const PRESET_BY_ID: Record<string, AdPreset> = Object.fromEntries(
  AD_PRESETS.map((p) => [p.id, p]),
);

/** Presets sorted for a business: its own category's presets float first. */
export function presetsForCategory(categorySlug: string | null): AdPreset[] {
  if (!categorySlug) return AD_PRESETS;
  return [...AD_PRESETS].sort((a, b) => {
    const am = a.bestFor.includes(categorySlug) ? 0 : 1;
    const bm = b.bestFor.includes(categorySlug) ? 0 : 1;
    return am - bm;
  });
}

/** Server-side prompt assembly — the only place a prompt is ever built. */
export function buildPrompt(
  preset: AdPreset,
  vars: { business: string; city: string; tagline: string; details: string },
): string {
  const clean = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 200);
  return preset.scene
    .replace("{business}", clean(vars.business))
    .replace("{city}", clean(vars.city) || "town")
    .replace("{tagline}", clean(vars.tagline) || "proud, local, and built to last")
    .replace("{details}", vars.details ? clean(vars.details) + "." : "");
}
