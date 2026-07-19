import "server-only";
import { getCouponByCode } from "./store-queries";
import type { CouponRow } from "./store-types";

export interface CouponCheck {
  valid: boolean;
  coupon?: CouponRow;
  discountCents?: number;
  reason?: string;
}

/** Validate a coupon against the current subtotal and compute its discount. */
export async function checkCoupon(code: string, subtotalCents: number): Promise<CouponCheck> {
  const coupon = await getCouponByCode(code);
  if (!coupon) return { valid: false, reason: "That code isn't valid." };
  if (!coupon.active) return { valid: false, reason: "That code is no longer active." };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
    return { valid: false, reason: "That code has expired." };
  if (coupon.max_redemptions !== null && coupon.times_redeemed >= coupon.max_redemptions)
    return { valid: false, reason: "That code has been fully redeemed." };

  const discountCents =
    coupon.discount_type === "percent"
      ? Math.round((subtotalCents * Math.min(100, Math.max(0, coupon.discount_value))) / 100)
      : Math.min(subtotalCents, coupon.discount_value);

  return { valid: true, coupon, discountCents };
}
