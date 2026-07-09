import type { Metadata } from "next";
import { db } from "@/lib/supabase";
import { CouponsManager } from "@/components/dashboard/OwnerEditors";

export const metadata: Metadata = { title: "Coupons", robots: { index: false } };

export default async function CouponsPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const { data } = await db()
    .from("coupons")
    .select("id,title,description,discount_type,discount_value,is_active,ends_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  return <CouponsManager businessId={businessId} coupons={data ?? []} />;
}
