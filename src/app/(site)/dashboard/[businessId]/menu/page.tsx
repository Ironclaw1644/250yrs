import type { Metadata } from "next";
import { getMenu } from "@/lib/queries";
import { MenuManager } from "@/components/dashboard/OwnerEditors";

export const metadata: Metadata = { title: "Menu", robots: { index: false } };

export default async function MenuPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const sections = await getMenu(businessId);
  return <MenuManager businessId={businessId} sections={sections} />;
}
