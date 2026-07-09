import type { Metadata } from "next";
import { db } from "@/lib/supabase";
import { BasicsForm } from "@/components/dashboard/OwnerEditors";
import type { Business } from "@/lib/db-types";

export const metadata: Metadata = { title: "Edit details", robots: { index: false } };

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const { data } = await db().from("businesses").select("*").eq("id", businessId).maybeSingle();
  if (!data) return null;
  return <BasicsForm business={data as Business} />;
}
