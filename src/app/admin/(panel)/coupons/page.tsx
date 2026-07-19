import { CouponForm } from "@/components/admin/coupon-form";
import { adminCoupons } from "@/lib/admin-queries";

export default async function AdminCouponsPage() {
  const coupons = await adminCoupons();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <p className="eyebrow">Coupons</p>
        <h1 className="font-display text-4xl text-brand-cream">Discount codes</h1>
      </div>

      <div>
        <p className="mb-2 text-sm text-white/50">New coupon</p>
        <CouponForm coupon={null} />
      </div>

      <div className="space-y-3">
        {coupons.map((c) => (
          <div key={c.id}>
            <p className="mb-1 text-xs text-white/40">
              {c.times_redeemed} redeemed{c.max_redemptions ? ` of ${c.max_redemptions}` : ""}
            </p>
            <CouponForm coupon={c} />
          </div>
        ))}
      </div>
    </div>
  );
}
