import type { Metadata } from "next";
import { getPhotos } from "@/lib/queries";
import { PhotoManager } from "@/components/dashboard/OwnerEditors";

export const metadata: Metadata = { title: "Photos", robots: { index: false } };

export default async function PhotosPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const photos = await getPhotos(businessId);
  return <PhotoManager businessId={businessId} photos={photos} />;
}
