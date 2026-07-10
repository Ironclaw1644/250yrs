import type { Metadata } from "next";
import { db } from "@/lib/supabase";
import { getCreditBalance } from "@/lib/actions/videos";
import { getPhotos } from "@/lib/queries";
import {
  VideoStudio,
  type StudioVideo,
  type StudioPhoto,
} from "@/components/dashboard/VideoStudio";

export const metadata: Metadata = { title: "TV Ads", robots: { index: false } };

export default async function VideosPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const [balance, photos, { data: videos }] = await Promise.all([
    getCreditBalance(businessId),
    getPhotos(businessId),
    db()
      .from("business_videos")
      .select(
        "id,title,url,thumbnail_url,status,source,duration_seconds,rejection_reason,created_at",
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <VideoStudio
      businessId={businessId}
      balance={balance}
      videos={(videos as StudioVideo[]) ?? []}
      photos={(photos as unknown as StudioPhoto[]) ?? []}
    />
  );
}
