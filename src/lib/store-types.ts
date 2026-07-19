/** Row types for the `wear` store schema (client-safe — types only). */

export type ProductStatus = "active" | "sold" | "draft";
export type OrderStatus = "pending" | "confirmed" | "fulfilled" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed";
export type DiscountType = "percent" | "fixed";

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
}

export interface ProductImageRow {
  id: string;
  product_id: string;
  public_url: string;
  alt: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductVariantRow {
  id: string;
  product_id: string;
  label: string;
  sku_suffix: string | null;
  price_cents_override: number | null;
  public_url: string | null;
  sort_order: number;
}

export interface ProductSizeRow {
  id: string;
  product_id: string;
  size: string;
  inventory: number | null;
  sort_order: number;
}

export interface ProductRow {
  id: string;
  sku: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  category_id: string | null;
  price_cents: number;
  currency: string;
  status: ProductStatus;
  featured: boolean;
  hidden: boolean;
  free_shipping: boolean;
  inventory: number | null;
  badge: string | null;
  release_note: string | null;
  materials: string[];
  details: string[];
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
}

export interface StoreProduct extends ProductRow {
  category: CategoryRow | null;
  images: ProductImageRow[];
  variants: ProductVariantRow[];
  sizes: ProductSizeRow[];
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  variant_label: string | null;
  size: string | null;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
  image_url: string | null;
}

export interface OrderRow {
  id: string;
  order_number: string;
  confirmation_token: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: Record<string, string> | null;
  billing_address: Record<string, string> | null;
  subtotal_cents: number;
  shipping_cents: number;
  discount_code: string | null;
  discount_cents: number;
  total_cents: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface OrderWithItems extends OrderRow {
  items: OrderItemRow[];
}

export interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  active: boolean;
  expires_at: string | null;
  max_redemptions: number | null;
  times_redeemed: number;
}

/** Primary image (or first) for a product. */
export function primaryImage(p: StoreProduct): ProductImageRow | undefined {
  return p.images.find((i) => i.is_primary) ?? p.images[0];
}

/** Effective unit price for a product+variant selection. */
export function unitPriceCents(p: StoreProduct, variantId?: string | null): number {
  const v = variantId ? p.variants.find((x) => x.id === variantId) : undefined;
  return v?.price_cents_override ?? p.price_cents;
}

/** Split a set's namespaced sizes into dimensions ("garment:M" / "shoe:us_10"). */
export function sizeDimensions(sizes: ProductSizeRow[]): {
  plain: ProductSizeRow[];
  groups: { key: string; label: string; sizes: ProductSizeRow[] }[];
} {
  const plain = sizes.filter((s) => !s.size.includes(":"));
  const byKey = new Map<string, ProductSizeRow[]>();
  for (const s of sizes) {
    const i = s.size.indexOf(":");
    if (i === -1) continue;
    const key = s.size.slice(0, i);
    byKey.set(key, [...(byKey.get(key) ?? []), s]);
  }
  const LABELS: Record<string, string> = { garment: "Garment size", shoe: "Shoe size (US)" };
  const groups = [...byKey.entries()].map(([key, list]) => ({
    key,
    label: LABELS[key] ?? key,
    sizes: list.sort((a, b) => a.sort_order - b.sort_order),
  }));
  return { plain: plain.sort((a, b) => a.sort_order - b.sort_order), groups };
}

/** Human label for a stored size value ("shoe:us_10_5" → "US 10.5", "M" → "M"). */
export function sizeLabel(size: string): string {
  const bare = size.includes(":") ? size.slice(size.indexOf(":") + 1) : size;
  if (bare.startsWith("us_")) return `US ${bare.slice(3).replace("_", ".")}`;
  return bare;
}
