"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { requireUser, ownsBusiness } from "@/lib/auth";
import { uploadToBucket, removeFromBucket, bucketPathFromUrl } from "@/lib/storage";

type Result = { ok: boolean; error?: string };
const fail = (error: string): Result => ({ ok: false, error });

/** Owner gate shared by every mutation in this file. */
async function gate(businessId: string): Promise<Result | null> {
  await requireUser();
  if (!(await ownsBusiness(businessId))) return fail("That business isn't in your account.");
  return null;
}

/** Revalidate the public page + hub for a business (fetch joined slugs once). */
async function revalidateBusiness(businessId: string): Promise<void> {
  const { data } = await db()
    .from("businesses")
    .select(
      "slug, category:categories(slug), city:cities(slug, state:states(slug, country:countries(slug)))",
    )
    .eq("id", businessId)
    .maybeSingle();
  const b = data as unknown as {
    slug: string;
    category: { slug: string } | null;
    city: { slug: string; state: { slug: string; country: { slug: string } } | null } | null;
  } | null;
  const co = b?.city?.state?.country?.slug;
  const st = b?.city?.state?.slug;
  const ci = b?.city?.slug;
  const cat = b?.category?.slug;
  if (co && st && ci && cat && b) {
    revalidatePath(`/${co}/${st}/${ci}/${cat}/${b.slug}`);
    revalidatePath(`/${co}/${st}/${ci}/${cat}`);
  }
  revalidatePath("/", "layout");
}

function dollarsToCents(v: FormDataEntryValue | null): number {
  const n = parseFloat(String(v ?? "0").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

// ---------- basics ----------
export async function updateListing(businessId: string, fd: FormData): Promise<Result> {
  const gated = await gate(businessId);
  if (gated) return gated;
  const patch = {
    name: String(fd.get("name") || "").trim(),
    tagline: String(fd.get("tagline") || "").trim() || null,
    description: String(fd.get("description") || "").trim() || null,
    address_line1: String(fd.get("address") || "").trim() || null,
    postal_code: String(fd.get("postal_code") || "").trim() || null,
    phone: String(fd.get("phone") || "").trim() || null,
    website_url: String(fd.get("website_url") || "").trim() || null,
  };
  if (!patch.name) return fail("Business name is required.");
  const { error } = await db().from("businesses").update(patch).eq("id", businessId);
  if (error) return fail(error.message);
  await revalidateBusiness(businessId);
  revalidatePath(`/dashboard/${businessId}`, "layout");
  return { ok: true };
}

// ---------- photos ----------
export async function addPhoto(businessId: string, fd: FormData): Promise<Result> {
  const gated = await gate(businessId);
  if (gated) return gated;
  const file = fd.get("file") as File | null;
  if (!file || file.size === 0) return fail("Choose a photo.");
  if (file.size > 6 * 1024 * 1024) return fail("Photo too large (max 6MB).");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `business/${businessId}/${Date.now()}.${ext}`;
  try {
    const url = await uploadToBucket(path, file);
    const { count } = await db()
      .from("business_photos")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId);
    const { error } = await db().from("business_photos").insert({
      business_id: businessId,
      url,
      alt_text: String(fd.get("alt") || "").trim() || null,
      is_primary: (count ?? 0) === 0,
      sort_order: count ?? 0,
    });
    if (error) return fail(error.message);
  } catch (e) {
    return fail((e as Error).message);
  }
  await revalidateBusiness(businessId);
  revalidatePath(`/dashboard/${businessId}/photos`);
  return { ok: true };
}

export async function setPrimaryPhoto(businessId: string, photoId: string): Promise<Result> {
  const gated = await gate(businessId);
  if (gated) return gated;
  const svc = db();
  await svc.from("business_photos").update({ is_primary: false }).eq("business_id", businessId);
  const { error } = await svc
    .from("business_photos")
    .update({ is_primary: true })
    .eq("id", photoId)
    .eq("business_id", businessId);
  if (error) return fail(error.message);
  await revalidateBusiness(businessId);
  revalidatePath(`/dashboard/${businessId}/photos`);
  return { ok: true };
}

export async function deletePhoto(businessId: string, photoId: string): Promise<Result> {
  const gated = await gate(businessId);
  if (gated) return gated;
  const svc = db();
  const { data: photo } = await svc
    .from("business_photos")
    .select("url")
    .eq("id", photoId)
    .eq("business_id", businessId)
    .maybeSingle();
  const { error } = await svc
    .from("business_photos")
    .delete()
    .eq("id", photoId)
    .eq("business_id", businessId);
  if (error) return fail(error.message);
  const bucketPath = photo?.url ? bucketPathFromUrl(photo.url) : null;
  if (bucketPath) await removeFromBucket([bucketPath]);
  await revalidateBusiness(businessId);
  revalidatePath(`/dashboard/${businessId}/photos`);
  return { ok: true };
}

// ---------- hours ----------
export async function saveHours(businessId: string, fd: FormData): Promise<Result> {
  const gated = await gate(businessId);
  if (gated) return gated;
  const rows = [];
  for (let d = 0; d < 7; d++) {
    const closed = fd.get(`closed_${d}`) === "on";
    const open = String(fd.get(`open_${d}`) || "");
    const close = String(fd.get(`close_${d}`) || "");
    rows.push({
      business_id: businessId,
      day_of_week: d,
      is_closed: closed || !open || !close,
      open_time: !closed && open ? open : null,
      close_time: !closed && close ? close : null,
    });
  }
  const svc = db();
  const { error: delErr } = await svc
    .from("business_hours")
    .delete()
    .eq("business_id", businessId);
  if (delErr) return fail(delErr.message);
  const { error } = await svc.from("business_hours").insert(rows);
  if (error) return fail(error.message);
  await revalidateBusiness(businessId);
  revalidatePath(`/dashboard/${businessId}/hours`);
  return { ok: true };
}

// ---------- menu ----------
export async function addMenuSection(businessId: string, fd: FormData): Promise<Result> {
  const gated = await gate(businessId);
  if (gated) return gated;
  const name = String(fd.get("name") || "").trim();
  if (!name) return fail("Section name required.");
  const { error } = await db().from("menu_sections").insert({ business_id: businessId, name });
  if (error) return fail(error.message);
  await revalidateBusiness(businessId);
  revalidatePath(`/dashboard/${businessId}/menu`);
  return { ok: true };
}

export async function deleteMenuSection(businessId: string, sectionId: string): Promise<Result> {
  const gated = await gate(businessId);
  if (gated) return gated;
  const { error } = await db()
    .from("menu_sections")
    .delete()
    .eq("id", sectionId)
    .eq("business_id", businessId);
  if (error) return fail(error.message);
  await revalidateBusiness(businessId);
  revalidatePath(`/dashboard/${businessId}/menu`);
  return { ok: true };
}

export async function addMenuItem(businessId: string, fd: FormData): Promise<Result> {
  const gated = await gate(businessId);
  if (gated) return gated;
  const sectionId = String(fd.get("section_id") || "");
  const name = String(fd.get("name") || "").trim();
  if (!sectionId || !name) return fail("Item name required.");
  const { error } = await db().from("menu_items").insert({
    section_id: sectionId,
    business_id: businessId,
    name,
    description: String(fd.get("description") || "").trim() || null,
    price_cents: dollarsToCents(fd.get("price")),
  });
  if (error) return fail(error.message);
  await revalidateBusiness(businessId);
  revalidatePath(`/dashboard/${businessId}/menu`);
  return { ok: true };
}

export async function deleteMenuItem(businessId: string, itemId: string): Promise<Result> {
  const gated = await gate(businessId);
  if (gated) return gated;
  const { error } = await db()
    .from("menu_items")
    .delete()
    .eq("id", itemId)
    .eq("business_id", businessId);
  if (error) return fail(error.message);
  await revalidateBusiness(businessId);
  revalidatePath(`/dashboard/${businessId}/menu`);
  return { ok: true };
}

// ---------- services ----------
export async function addService(businessId: string, fd: FormData): Promise<Result> {
  const gated = await gate(businessId);
  if (gated) return gated;
  const name = String(fd.get("name") || "").trim();
  if (!name) return fail("Service name required.");
  const duration = parseInt(String(fd.get("duration") || "30"), 10);
  const { error } = await db().from("services").insert({
    business_id: businessId,
    name,
    description: String(fd.get("description") || "").trim() || null,
    price_cents: dollarsToCents(fd.get("price")),
    duration_minutes: Number.isFinite(duration) && duration > 0 ? duration : 30,
  });
  if (error) return fail(error.message);
  await revalidateBusiness(businessId);
  revalidatePath(`/dashboard/${businessId}/services`);
  return { ok: true };
}

export async function deleteService(businessId: string, serviceId: string): Promise<Result> {
  const gated = await gate(businessId);
  if (gated) return gated;
  const { error } = await db()
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("business_id", businessId);
  if (error) return fail(error.message);
  await revalidateBusiness(businessId);
  revalidatePath(`/dashboard/${businessId}/services`);
  return { ok: true };
}

// ---------- coupons ----------
export async function addCoupon(businessId: string, fd: FormData): Promise<Result> {
  const gated = await gate(businessId);
  if (gated) return gated;
  const title = String(fd.get("title") || "").trim();
  if (!title) return fail("Coupon title required.");
  const type = fd.get("discount_type") === "amount" ? "amount" : "percent";
  const raw = String(fd.get("discount_value") || "0").replace(/[%$,\s]/g, "");
  const value =
    type === "amount" ? dollarsToCents(raw) : Math.min(100, Math.max(1, parseInt(raw, 10) || 0));
  if (!value) return fail("Enter a discount value.");
  const ends = String(fd.get("ends_at") || "");
  const { error } = await db().from("coupons").insert({
    business_id: businessId,
    title,
    description: String(fd.get("description") || "").trim() || null,
    discount_type: type,
    discount_value: value,
    ends_at: ends ? new Date(`${ends}T23:59:59`).toISOString() : null,
    is_active: true,
  });
  if (error) return fail(error.message);
  await revalidateBusiness(businessId);
  revalidatePath(`/dashboard/${businessId}/coupons`);
  return { ok: true };
}

export async function toggleCoupon(businessId: string, couponId: string, active: boolean): Promise<Result> {
  const gated = await gate(businessId);
  if (gated) return gated;
  const { error } = await db()
    .from("coupons")
    .update({ is_active: active })
    .eq("id", couponId)
    .eq("business_id", businessId);
  if (error) return fail(error.message);
  await revalidateBusiness(businessId);
  revalidatePath(`/dashboard/${businessId}/coupons`);
  return { ok: true };
}

export async function deleteCoupon(businessId: string, couponId: string): Promise<Result> {
  const gated = await gate(businessId);
  if (gated) return gated;
  const { error } = await db()
    .from("coupons")
    .delete()
    .eq("id", couponId)
    .eq("business_id", businessId);
  if (error) return fail(error.message);
  await revalidateBusiness(businessId);
  revalidatePath(`/dashboard/${businessId}/coupons`);
  return { ok: true };
}
