import type { BusinessHour } from "./db-types";

export function centsToUSD(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((cents ?? 0) / 100);
}

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "13:30:00" | "13:30" -> "1:30 PM" */
export function formatTime(t: string | null): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

/** Approx "open now" from weekly hours using server local time (v1 heuristic). */
export function computeOpenNow(hours: BusinessHour[]): {
  open: boolean;
  label: string;
} {
  if (!hours || hours.length === 0) return { open: false, label: "Hours not listed" };
  const now = new Date();
  const dow = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const today = hours.filter((h) => h.day_of_week === dow);
  if (today.length === 0 || today.every((h) => h.is_closed)) {
    return { open: false, label: "Closed today" };
  }
  for (const h of today) {
    if (h.is_closed || !h.open_time || !h.close_time) continue;
    const [oh, om] = h.open_time.split(":").map(Number);
    const [ch, cm] = h.close_time.split(":").map(Number);
    const open = oh * 60 + om;
    let close = ch * 60 + cm;
    if (close <= open) close += 24 * 60; // past-midnight
    if (mins >= open && mins < close) {
      return { open: true, label: `Open now · until ${formatTime(h.close_time)}` };
    }
  }
  const next = today.find((h) => !h.is_closed && h.open_time);
  return {
    open: false,
    label: next ? `Closed · opens ${formatTime(next.open_time)}` : "Closed",
  };
}

/** Price tier ($–$$$) from an average menu price in cents. */
export function priceTier(avgCents: number | null): string {
  if (!avgCents) return "$";
  if (avgCents < 800) return "$";
  if (avgCents < 1600) return "$$";
  return "$$$";
}
