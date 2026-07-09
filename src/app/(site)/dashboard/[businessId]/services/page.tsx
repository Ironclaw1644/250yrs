import type { Metadata } from "next";
import { db } from "@/lib/supabase";
import { ServicesManager } from "@/components/dashboard/OwnerEditors";

export const metadata: Metadata = { title: "Services", robots: { index: false } };

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const { data } = await db()
    .from("services")
    .select("id,name,description,price_cents,duration_minutes")
    .eq("business_id", businessId)
    .order("sort_order");
  return <ServicesManager businessId={businessId} services={data ?? []} />;
}
