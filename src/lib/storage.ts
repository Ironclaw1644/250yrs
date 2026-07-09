import "server-only";
import { db } from "./supabase";

const BUCKET = "taw-media";

/** Upload a File to the public taw-media bucket; returns the public URL. */
export async function uploadToBucket(path: string, file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const { error } = await db()
    .storage.from(BUCKET)
    .upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: true });
  if (error) throw new Error(error.message);
  const { data } = db().storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function removeFromBucket(paths: string[]): Promise<void> {
  if (!paths.length) return;
  await db().storage.from(BUCKET).remove(paths);
}

/** Extract the bucket path from a taw-media public URL (for deletes). */
export function bucketPathFromUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}
