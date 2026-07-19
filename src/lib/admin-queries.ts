import "server-only";
import { db } from "./supabase/admin";
import type {
  CategoryRow,
  CouponRow,
  OrderRow,
  OrderWithItems,
  ProductImageRow,
  ProductRow,
  ProductSizeRow,
  ProductVariantRow,
} from "./store-types";

export interface AdminProduct extends ProductRow {
  images: ProductImageRow[];
  variants: ProductVariantRow[];
  sizes: ProductSizeRow[];
}

export async function adminProducts(): Promise<AdminProduct[]> {
  const svc = db();
  const [{ data: products }, { data: images }, { data: variants }, { data: sizes }] =
    await Promise.all([
      svc.from("products").select("*").order("sort_order"),
      svc.from("product_images").select("*").order("sort_order"),
      svc.from("product_variants").select("*").order("sort_order"),
      svc.from("product_sizes").select("*").order("sort_order"),
    ]);
  return ((products as ProductRow[]) ?? []).map((p) => ({
    ...p,
    images: ((images as ProductImageRow[]) ?? []).filter((i) => i.product_id === p.id),
    variants: ((variants as ProductVariantRow[]) ?? []).filter((v) => v.product_id === p.id),
    sizes: ((sizes as ProductSizeRow[]) ?? []).filter((s) => s.product_id === p.id),
  }));
}

export async function adminProduct(id: string): Promise<AdminProduct | null> {
  return (await adminProducts()).find((p) => p.id === id) ?? null;
}

export async function adminCategories(): Promise<CategoryRow[]> {
  const { data } = await db().from("categories").select("*").order("sort_order");
  return (data as CategoryRow[]) ?? [];
}

export async function adminOrders(status?: string): Promise<OrderRow[]> {
  let q = db().from("orders").select("*").order("created_at", { ascending: false }).limit(200);
  if (status && status !== "all") q = q.eq("status", status);
  const { data } = await q;
  return (data as OrderRow[]) ?? [];
}

export async function adminOrder(id: string): Promise<OrderWithItems | null> {
  const svc = db();
  const { data: order } = await svc.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) return null;
  const { data: items } = await svc.from("order_items").select("*").eq("order_id", id);
  return { ...order, items: items ?? [] } as OrderWithItems;
}

export async function adminCoupons(): Promise<CouponRow[]> {
  const { data } = await db().from("coupons").select("*").order("created_at", { ascending: false });
  return (data as CouponRow[]) ?? [];
}

export interface SubscriberRow {
  id: string;
  email: string;
  name: string | null;
  status: string;
  source: string | null;
  created_at: string;
}

export async function adminSubscribers(): Promise<SubscriberRow[]> {
  const { data } = await db()
    .from("subscribers")
    .select("id, email, name, status, source, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  return (data as SubscriberRow[]) ?? [];
}

export interface AdminDashboard {
  revenueCents: number;
  paidOrders: number;
  pendingFulfillment: number;
  subscribers: number;
  views7d: number;
  recentOrders: OrderRow[];
}

export async function adminDashboard(): Promise<AdminDashboard> {
  const svc = db();
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const [paid, subs, views, recent] = await Promise.all([
    svc.from("orders").select("total_cents, status").eq("payment_status", "paid"),
    svc.from("subscribers").select("id", { count: "exact", head: true }).eq("status", "subscribed"),
    svc.from("events").select("id", { count: "exact", head: true }).eq("event_type", "page_view").gte("created_at", weekAgo),
    svc.from("orders").select("*").order("created_at", { ascending: false }).limit(8),
  ]);
  const paidRows = (paid.data as { total_cents: number; status: string }[]) ?? [];
  return {
    revenueCents: paidRows.reduce((s, o) => s + o.total_cents, 0),
    paidOrders: paidRows.length,
    pendingFulfillment: paidRows.filter((o) => o.status === "confirmed").length,
    subscribers: subs.count ?? 0,
    views7d: views.count ?? 0,
    recentOrders: (recent.data as OrderRow[]) ?? [],
  };
}

export async function adminSettings(): Promise<Record<string, string>> {
  const { data } = await db().from("site_settings").select("key, value");
  return Object.fromEntries(
    ((data as { key: string; value: unknown }[]) ?? []).map((r) => [
      r.key,
      typeof r.value === "string" ? r.value : JSON.stringify(r.value),
    ]),
  );
}
