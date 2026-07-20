import type { Metadata } from "next";
import { db } from "@/lib/supabase";
import { getCreditBalance } from "@/lib/actions/videos";
import { getPhotos } from "@/lib/queries";
import { falConfigured } from "@/lib/fal";
import { reconcilePendingVideos } from "@/lib/video-finalize";
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

  // Self-healing: pick up any renders whose webhook we missed.
  if (falConfigured) await reconcilePendingVideos(businessId);

  const [balance, photos, { data: videos }, { data: biz }] = await Promise.all([
    getCreditBalance(businessId),
    getPhotos(businessId),
    db()
      .from("business_videos")
      .select(
        "id,title,url,thumbnail_url,status,source,duration_seconds,rejection_reason,created_at",
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
    db()
      .from("businesses")
      .select("category:categories(slug)")
      .eq("id", businessId)
      .maybeSingle(),
  ]);

  const categorySlug =
    (biz as { category?: { slug?: string } } | null)?.category?.slug ?? null;

  return (
    <VideoStudio
      businessId={businessId}
      balance={balance}
      videos={(videos as StudioVideo[]) ?? []}
      photos={(photos as unknown as StudioPhoto[]) ?? []}
      categorySlug={categorySlug}
      studioReady={falConfigured}
    />
  );
}
