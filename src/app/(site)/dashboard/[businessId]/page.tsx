import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/supabase";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Listing overview", robots: { index: false } };

export default async function BusinessOverview({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const svc = db();
  const [{ data: biz }, photos, hours, menuItems, services, coupons] = await Promise.all([
    svc.from("businesses").select("id,name,status,plan_tier,description,phone").eq("id", businessId).maybeSingle(),
    svc.from("business_photos").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    svc.from("business_hours").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    svc.from("menu_items").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    svc.from("services").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    svc.from("coupons").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("is_active", true),
  ]);
  if (!biz) return null;

  const steps = [
    {
      done: (photos.count ?? 0) > 0,
      label: "Add photos",
      hint: "Listings with photos get far more calls",
      href: `photos`,
      icon: "image",
    },
    {
      done: (hours.count ?? 0) > 0,
      label: "Set your hours",
      hint: "So customers know when you're open",
      href: `hours`,
      icon: "clock",
    },
    {
      done: (menuItems.count ?? 0) > 0 || (services.count ?? 0) > 0,
      label: "Add your menu or services",
      hint: "Show what you offer, with prices",
      href: `menu`,
      icon: "utensils",
    },
    {
      done: (coupons.count ?? 0) > 0,
      label: "Post a deal (optional)",
      hint: "A simple coupon brings people in",
      href: `coupons`,
      icon: "tag",
    },
    {
      done: biz.status === "published",
      label: "Go live",
      hint: "Pick a plan and appear in local search",
      href: `advertise`,
      icon: "bullhorn",
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="max-w-2xl">
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-h3 text-navy">Next steps</h2>
          <span className="font-sans text-small font-bold text-stone">
            {doneCount}/{steps.length} done
          </span>
        </div>
        <ol className="mt-4 space-y-3">
          {steps.map((s) => (
            <li key={s.label}>
              <Link
                href={`/dashboard/${businessId}/${s.href}`}
                className={`flex items-center gap-4 rounded-lg border-2 p-4 transition-colors ${
                  s.done
                    ? "border-success/30 bg-success/5"
                    : "border-navy/10 hover:border-gold"
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                    s.done ? "bg-success text-paper" : "bg-navy text-gold"
                  }`}
                >
                  <Icon name={s.done ? "check" : s.icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-heading font-semibold ${s.done ? "text-success line-through" : "text-navy"}`}>
                    {s.label}
                  </span>
                  <span className="block text-small text-stone">{s.hint}</span>
                </span>
                {!s.done && <Icon name="chevron-right" className="text-gold" />}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
