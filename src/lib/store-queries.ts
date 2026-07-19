import "server-only";
import { cache } from "react";
import { db, dbConfigured } from "./supabase/admin";
import type {
  CategoryRow,
  CouponRow,
  OrderWithItems,
  ProductImageRow,
  ProductRow,
  ProductSizeRow,
  ProductVariantRow,
  StoreProduct,
} from "./store-types";

/* Storefront reads (bondandfifth model: fetch flat, stitch in memory). */

function stitch(
  products: ProductRow[],
  categories: CategoryRow[],
  images: ProductImageRow[],
  variants: ProductVariantRow[],
  sizes: ProductSizeRow[],
): StoreProduct[] {
  const catById = new Map(categories.map((c) => [c.id, c]));
  return products.map((p) => ({
    ...p,
    category: p.category_id ? (catById.get(p.category_id) ?? null) : null,
    images: images
      .filter((i) => i.product_id === p.id)
      .sort((a, b) => a.sort_order - b.sort_order),
    variants: variants
      .filter((v) => v.product_id === p.id)
      .sort((a, b) => a.sort_order - b.sort_order),
    sizes: sizes
      .filter((s) => s.product_id === p.id)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));
}

async function fetchAll(includeHidden = false): Promise<StoreProduct[]> {
  if (!dbConfigured) return [];
  try {
    const svc = db();
    let q = svc
      .from("products")
      .select("*")
      .in("status", ["active", "sold"])
      .order("sort_order");
    if (!includeHidden) q = q.eq("hidden", false);
    const [{ data: products }, { data: cats }, { data: images }, { data: variants }, { data: sizes }] =
      await Promise.all([
        q,
        svc.from("categories").select("*").order("sort_order"),
        svc.from("product_images").select("*"),
        svc.from("product_variants").select("*"),
        svc.from("product_sizes").select("*"),
      ]);
    return stitch(
      (products as ProductRow[]) ?? [],
      (cats as CategoryRow[]) ?? [],
      (images as ProductImageRow[]) ?? [],
      (variants as ProductVariantRow[]) ?? [],
      (sizes as ProductSizeRow[]) ?? [],
    );
  } catch (e) {
    console.error("[store] fetchAll", (e as Error).message);
    return [];
  }
}

/** All visible products, request-deduped. */
export const getActiveProducts = cache(() => fetchAll(false));

export async function getProductBySlug(slug: string): Promise<StoreProduct | null> {
  const all = await getActiveProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getProductSlugs(): Promise<string[]> {
  return (await getActiveProducts()).map((p) => p.slug);
}

export const getCategories = cache(async (): Promise<CategoryRow[]> => {
  if (!dbConfigured) return [];
  const { data } = await db().from("categories").select("*").order("sort_order");
  return (data as CategoryRow[]) ?? [];
});

export async function getOrderByToken(token: string): Promise<OrderWithItems | null> {
  if (!dbConfigured || !token) return null;
  try {
    const svc = db();
    const { data: order } = await svc
      .from("orders")
      .select("*")
      .eq("confirmation_token", token)
      .maybeSingle();
    if (!order) return null;
    const { data: items } = await svc
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at");
    return { ...order, items: items ?? [] } as OrderWithItems;
  } catch {
    return null;
  }
}

export async function getCouponByCode(code: string): Promise<CouponRow | null> {
  if (!dbConfigured || !code) return null;
  const { data } = await db()
    .from("coupons")
    .select("*")
    .ilike("code", code.trim())
    .maybeSingle();
  return (data as CouponRow) ?? null;
}

/** Editable-copy / settings KV. */
export const getAllCopy = cache(async (): Promise<Record<string, string>> => {
  if (!dbConfigured) return {};
  try {
    const { data } = await db().from("site_settings").select("key, value");
    return Object.fromEntries(
      ((data as { key: string; value: unknown }[]) ?? []).map((r) => [
        r.key,
        typeof r.value === "string" ? r.value : JSON.stringify(r.value),
      ]),
    );
  } catch {
    return {};
  }
});
