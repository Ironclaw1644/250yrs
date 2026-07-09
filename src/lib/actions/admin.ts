"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { assertAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { uploadToBucket } from "@/lib/storage";
import { isValidCopyKey } from "@/lib/copy-registry";

type Result = { ok: boolean; error?: string };

function fail(error: string): Result {
  return { ok: false, error };
}

async function gate(): Promise<{ id: string } | null> {
  try {
    return await assertAdmin();
  } catch {
    return null;
  }
}

/** Publish / suspend / archive a business (admin takedown & restore). */
export async function setBusinessStatus(
  businessId: string,
  status: "published" | "suspended" | "draft" | "archived",
): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const { error } = await db()
    .from("businesses")
    .update({
      status,
      ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("id", businessId);
  if (error) return fail(error.message);
  void audit(admin.id, `business.${status}`, "business", businessId);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setBusinessFeatured(
  businessId: string,
  featured: boolean,
): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const { error } = await db()
    .from("businesses")
    .update({ featured_city: featured })
    .eq("id", businessId);
  if (error) return fail(error.message);
  void audit(admin.id, featured ? "business.feature" : "business.unfeature", "business", businessId);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteBusiness(businessId: string): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const { error } = await db().from("businesses").delete().eq("id", businessId);
  if (error) return fail(error.message);
  void audit(admin.id, "business.delete", "business", businessId);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setUserRole(
  userId: string,
  role: "customer" | "business_owner" | "admin",
): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  if (userId === admin.id && role !== "admin") {
    return fail("You can't remove your own admin role.");
  }
  const { error } = await db().from("profiles").update({ role }).eq("id", userId);
  if (error) return fail(error.message);
  void audit(admin.id, `user.role.${role}`, "profile", userId);
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setReviewStatus(
  reviewId: string,
  status: "visible" | "flagged" | "hidden" | "removed",
): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const { error } = await db()
    .from("reviews")
    .update({ moderation_status: status })
    .eq("id", reviewId);
  if (error) return fail(error.message);
  void audit(admin.id, `review.${status}`, "review", reviewId);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Save site settings (contact info etc.) from the admin Settings form. */
export async function updateSiteSettings(formData: FormData): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const entries: [string, string][] = [];
  for (const [k, v] of formData.entries()) {
    if (typeof v !== "string") continue;
    const key = `site.${k}`;
    if (isValidCopyKey(key)) entries.push([key, v.trim()]);
  }
  for (const [key, value] of entries) {
    const { error } = await db()
      .from("site_content")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) return fail(error.message);
  }
  void audit(admin.id, "settings.update", "site_content", null, {
    keys: entries.map(([k]) => k),
  });
  const { revalidateTag } = await import("next/cache");
  revalidateTag("site-content");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Upload an image into a named site slot (img.<page>.<slot>). */
export async function uploadSiteImage(formData: FormData): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const slot = String(formData.get("slot") || "");
  const file = formData.get("file") as File | null;
  const key = `img.${slot}`;
  if (!file || file.size === 0) return fail("Choose an image file.");
  if (!isValidCopyKey(key)) return fail("Invalid image slot.");
  if (file.size > 6 * 1024 * 1024) return fail("Image too large (max 6MB).");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  try {
    const url = await uploadToBucket(`site/${slot.replace(/\./g, "-")}.${ext}`, file);
    const { error } = await db()
      .from("site_content")
      .upsert({ key, value: url }, { onConflict: "key" });
    if (error) return fail(error.message);
  } catch (e) {
    return fail((e as Error).message);
  }
  void audit(admin.id, "settings.image", "site_content", null, { key });
  const { revalidateTag } = await import("next/cache");
  revalidateTag("site-content");
  revalidatePath("/", "layout");
  return { ok: true };
}
