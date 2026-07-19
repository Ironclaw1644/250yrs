"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { db, STORAGE_BUCKET } from "@/lib/supabase/admin";

type Result = { ok: boolean; error?: string };

function fail(error: string): Result {
  return { ok: false, error };
}

async function gate(): Promise<{ email: string } | null> {
  try {
    return await assertAdmin();
  } catch {
    return null;
  }
}

async function audit(actor: string, action: string, entity?: string, entityId?: string, diff?: unknown) {
  try {
    await db().from("admin_audit_log").insert({
      actor_email: actor,
      action,
      entity: entity ?? null,
      entity_id: entityId ?? null,
      diff: diff ?? null,
    });
  } catch (e) {
    console.error("[audit]", (e as Error).message);
  }
}

function revalidateStore() {
  revalidatePath("/", "layout");
}

/* ---------------- products ---------------- */

export async function saveProduct(productId: string | null, fd: FormData): Promise<Result & { id?: string }> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const svc = db();

  const name = String(fd.get("name") ?? "").trim();
  if (!name) return fail("Name is required.");
  const priceDollars = Number(fd.get("price") ?? 0);
  if (!(priceDollars > 0)) return fail("Enter a price.");

  const row = {
    name,
    subtitle: String(fd.get("subtitle") ?? "").trim() || null,
    description: String(fd.get("description") ?? "").trim() || null,
    price_cents: Math.round(priceDollars * 100),
    status: String(fd.get("status") ?? "active"),
    featured: fd.get("featured") === "on",
    hidden: fd.get("hidden") === "on",
    free_shipping: fd.get("free_shipping") === "on",
    badge: String(fd.get("badge") ?? "").trim() || null,
    release_note: String(fd.get("release_note") ?? "").trim() || null,
    inventory: fd.get("inventory") ? Math.max(0, Number(fd.get("inventory"))) : null,
    category_id: String(fd.get("category_id") ?? "") || null,
    sort_order: Number(fd.get("sort_order") ?? 0),
    seo_title: String(fd.get("seo_title") ?? "").trim() || null,
    seo_description: String(fd.get("seo_description") ?? "").trim() || null,
  };

  if (productId) {
    const { error } = await svc.from("products").update(row).eq("id", productId);
    if (error) return fail(error.message);
    void audit(admin.email, "product.update", "product", productId, { name });
    revalidateStore();
    return { ok: true, id: productId };
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const sku = `WEAR-${Date.now().toString(36).toUpperCase()}`;
  const { data, error } = await svc
    .from("products")
    .insert({ ...row, slug, sku })
    .select("id")
    .single();
  if (error) return fail(error.message);
  void audit(admin.email, "product.create", "product", data.id, { name });
  revalidateStore();
  return { ok: true, id: data.id };
}

export async function uploadProductImage(productId: string, fd: FormData): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const file = fd.get("file") as File | null;
  if (!file || file.size === 0) return fail("Choose an image.");
  if (file.size > 8 * 1024 * 1024) return fail("Image too large (max 8MB).");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `products/${productId}/${Date.now()}.${ext}`;
  const svc = db();
  const bytes = await file.arrayBuffer();
  const { error: upErr } = await svc.storage
    .from(STORAGE_BUCKET)
    .upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: true });
  if (upErr) return fail(upErr.message);
  const { data: pub } = svc.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  const { count } = await svc
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  const { error } = await svc.from("product_images").insert({
    product_id: productId,
    storage_path: path,
    public_url: pub.publicUrl,
    is_primary: (count ?? 0) === 0,
    sort_order: count ?? 0,
  });
  if (error) return fail(error.message);
  void audit(admin.email, "product.image.add", "product", productId);
  revalidateStore();
  return { ok: true };
}

export async function setPrimaryImage(productId: string, imageId: string): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const svc = db();
  await svc.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  const { error } = await svc.from("product_images").update({ is_primary: true }).eq("id", imageId);
  if (error) return fail(error.message);
  revalidateStore();
  return { ok: true };
}

export async function deleteProductImage(imageId: string): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const { error } = await db().from("product_images").delete().eq("id", imageId);
  if (error) return fail(error.message);
  revalidateStore();
  return { ok: true };
}

export async function saveSizes(productId: string, fd: FormData): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const svc = db();
  // Rows arrive as size_<i> / inv_<i> pairs.
  const updates: { size: string; inventory: number | null }[] = [];
  for (let i = 0; i < 60; i++) {
    const size = fd.get(`size_${i}`);
    if (size === null) continue;
    const invRaw = String(fd.get(`inv_${i}`) ?? "").trim();
    updates.push({
      size: String(size),
      inventory: invRaw === "" ? null : Math.max(0, Number(invRaw)),
    });
  }
  for (const [i, u] of updates.entries()) {
    const { error } = await svc
      .from("product_sizes")
      .upsert(
        { product_id: productId, size: u.size, inventory: u.inventory, sort_order: i },
        { onConflict: "product_id,size" },
      );
    if (error) return fail(error.message);
  }
  // Remove sizes deleted in the editor.
  const keep = updates.map((u) => u.size);
  const del = svc.from("product_sizes").delete().eq("product_id", productId);
  const { error: delErr } = keep.length
    ? await del.not("size", "in", `(${keep.map((s) => `"${s.replace(/"/g, "")}"`).join(",")})`)
    : await del;
  if (delErr) return fail(delErr.message);
  void audit(admin.email, "product.sizes", "product", productId);
  revalidateStore();
  return { ok: true };
}

export async function deleteSize(sizeId: string): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const { error } = await db().from("product_sizes").delete().eq("id", sizeId);
  if (error) return fail(error.message);
  revalidateStore();
  return { ok: true };
}

/* ---------------- orders ---------------- */

export async function setOrderStatus(
  orderId: string,
  status: "pending" | "confirmed" | "fulfilled" | "cancelled",
): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const { error } = await db().from("orders").update({ status }).eq("id", orderId);
  if (error) return fail(error.message);
  void audit(admin.email, `order.${status}`, "order", orderId);
  revalidatePath("/admin/orders");
  return { ok: true };
}

/* ---------------- coupons ---------------- */

export async function saveCoupon(couponId: string | null, fd: FormData): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const code = String(fd.get("code") ?? "").trim().toUpperCase();
  if (!code) return fail("Code is required.");
  const row = {
    code,
    description: String(fd.get("description") ?? "").trim() || null,
    discount_type: String(fd.get("discount_type") ?? "percent"),
    discount_value: Math.max(0, Number(fd.get("discount_value") ?? 0)),
    active: fd.get("active") === "on",
    expires_at: fd.get("expires_at") ? new Date(String(fd.get("expires_at"))).toISOString() : null,
    max_redemptions: fd.get("max_redemptions") ? Number(fd.get("max_redemptions")) : null,
  };
  const svc = db();
  const { error } = couponId
    ? await svc.from("coupons").update(row).eq("id", couponId)
    : await svc.from("coupons").insert(row);
  if (error) return fail(error.message);
  void audit(admin.email, couponId ? "coupon.update" : "coupon.create", "coupon", couponId ?? code);
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function deleteCoupon(couponId: string): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const { error } = await db().from("coupons").delete().eq("id", couponId);
  if (error) return fail(error.message);
  revalidatePath("/admin/coupons");
  return { ok: true };
}

/* ---------------- subscribers ---------------- */

export async function setSubscriberStatus(id: string, status: "subscribed" | "unsubscribed"): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const { error } = await db().from("subscribers").update({ status }).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/admin/subscribers");
  return { ok: true };
}

/* ---------------- settings / editable copy ---------------- */

const SETTING_KEYS = new Set([
  "copy.home.hero.title",
  "copy.home.hero.subtitle",
  "copy.home.trust.1",
  "copy.home.trust.2",
  "copy.home.trust.3",
  "copy.shop.hero.title",
  "site.announcement",
  "site.contact_email",
]);

export async function saveSettings(fd: FormData): Promise<Result> {
  const admin = await gate();
  if (!admin) return fail("Not authorized");
  const svc = db();
  for (const [k, v] of fd.entries()) {
    if (typeof v !== "string" || !SETTING_KEYS.has(k)) continue;
    const { error } = await svc
      .from("site_settings")
      .upsert({ key: k, value: JSON.stringify(v.trim()) }, { onConflict: "key" });
    if (error) return fail(error.message);
  }
  void audit(admin.email, "settings.update", "site_settings");
  revalidateStore();
  return { ok: true };
}
