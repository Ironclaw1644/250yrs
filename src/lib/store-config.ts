/** Store-wide commerce rules (client-safe). Mirrors bondandfifth's model. */

export const SHIPPING_FLAT_CENTS = 695;
export const FREE_SHIPPING_THRESHOLD_CENTS = 12500; // $125+

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/**
 * Shipping for a set of lines. Free once the subtotal clears the threshold;
 * lines whose product is flagged free_shipping don't count toward needing it.
 */
export function shippingCentsFor(
  lines: { lineTotalCents: number; freeShipping: boolean }[],
): number {
  if (lines.length === 0) return 0;
  const paidLines = lines.filter((l) => !l.freeShipping);
  if (paidLines.length === 0) return 0;
  const subtotal = lines.reduce((s, l) => s + l.lineTotalCents, 0);
  return subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS;
}

export const NEWSLETTER_COUPON = "FOUNDERS10";
