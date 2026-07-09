import type { Metadata } from "next";
import { getHours } from "@/lib/queries";
import { HoursEditor } from "@/components/dashboard/OwnerEditors";

export const metadata: Metadata = { title: "Hours", robots: { index: false } };

export default async function HoursPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const hours = await getHours(businessId);
  return <HoursEditor businessId={businessId} hours={hours} />;
}
