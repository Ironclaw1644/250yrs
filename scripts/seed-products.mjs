/**
 * One-time (idempotent) migration of the hardcoded catalog in src/lib/products.ts
 * into the `wear` schema. After this runs, the DATABASE is the source of truth
 * and the admin portal manages products.
 *
 *   node scripts/seed-products.mjs
 *
 * Upserts by slug/sku; images keyed on (product_id, public_url); sizes on
 * (product_id, size) — safe to re-run.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function parseEnv(file) {
  const out = {};
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {}
  return out;
}
const env = { ...parseEnv(join(root, ".env.local")), ...process.env };
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  db: { schema: env.SUPABASE_SCHEMA || "wear" },
  auth: { persistSession: false },
});

const GARMENT_SIZES = ["S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["us_7", "us_7_5", "us_8", "us_8_5", "us_9", "us_9_5", "us_10", "us_10_5", "us_11", "us_11_5", "us_12", "us_13"];

const C = "/campaign/true-american-wear";
const P = "/true-american-wear";

const PRODUCTS = [
  {
    sku: "WEAR-001", slug: "making-waves-in-history-t-shirt", name: "Making Waves In History T-Shirt",
    subtitle: "Limited-run MAGA tee", price_cents: 10000, category: "garments", featured: true, sort: 0,
    badge: "NEW RELEASE", release_note: "Limited run — only 150,000 made.",
    description: "Limited run — only 150,000 made.",
    materials: ["Premium cotton jersey", "Full-front MAGA graphic", "Soft hand feel with structured drape"],
    details: ["Standard fit", "Designed for clean standalone wear", "Placed near the top of the collection"],
    seo_title: "Making Waves In History T-Shirt",
    seo_description: "Shop the Making Waves In History T-Shirt from True American Wear, a limited-run patriotic graphic tee with a bold front print and clean everyday fit.",
    images: [
      [`${P}/maga_history_shirt.jpg`, "Making Waves In History T-Shirt product image."],
      [`${C}/making-waves-female-editorial.jpg`, "Model wearing Making Waves in History T-shirt"],
      [`${C}/making-waves-couple-editorial.jpg`, "Couple wearing Making Waves in History T-shirt"],
    ],
  },
  {
    sku: "WEAR-002", slug: "founders-1776-crewneck", name: "Founders 1776 Crewneck",
    subtitle: "Black 250 Years crewneck", price_cents: 15000, category: "garments", featured: true, sort: 1,
    badge: "Featured piece", release_note: "Limited collection.",
    description: "A structured black crewneck with a strong shoulder, brushed interior, and a front graphic built to carry the 250th year with weight and presence.",
    materials: ["14 oz brushed fleece", "Structured rib collar and cuffs", "Vintage-distressed front graphic"],
    details: ["Relaxed athletic fit", "All-season layering weight", "Built for the Fourth and beyond"],
    images: [
      [`${P}/flag-sweater.jpg`, "Black 1776 250 Years 2026 crewneck with sweeping flag graphic."],
      [`${C}/03-lifestyle-product-shot-founders-1776-crewneck.webp`, "Founders 1776 Crewneck lifestyle shot"],
      [`${C}/09-close-detail-shot-founders-1776-crewneck.webp`, "Founders 1776 Crewneck detail shot"],
    ],
  },
  {
    sku: "WEAR-003", slug: "liberty-eagle-hoodie", name: "Liberty Eagle Hoodie",
    subtitle: "Gray 250 Years eagle hoodie", price_cents: 25000, category: "garments", featured: true, sort: 2,
    badge: "Collection essential", release_note: "Core collection staple.",
    description: "Heather gray fleece with a broad-wing eagle graphic, 1776 to 2026 lettering, and a hood lined to carry the piece from front to back.",
    materials: ["Heavy fleece hoodie body", "Double-layer hood", "Front pouch pocket"],
    details: ["Graphic-led statement piece", "Drawcord hood closure", "Soft brushed hand feel"],
    images: [
      [`${P}/eagle-hoodie.jpg`, "Gray hoodie with 1776 2026 eagle artwork and 250 Years text."],
      [`${C}/05-lifestyle-product-shot-liberty-eagle-hoodie.webp`, "Liberty Eagle Hoodie lifestyle shot"],
      [`${C}/10-close-detail-shot-liberty-eagle-hoodie.webp`, "Liberty Eagle Hoodie detail shot"],
    ],
  },
  {
    sku: "WEAR-004", slug: "redline-250-shirt", name: "Redline 250 Shirt",
    subtitle: "Red striped 250 Years shirt", price_cents: 8500, category: "garments", featured: false, sort: 3,
    badge: "Summer release", release_note: "Summer release piece.",
    description: "A red-and-cream striped shirt with a centered 250 Years mark and anniversary numerals, designed to add a sharper pop of color to the collection.",
    materials: ["Midweight jersey knit", "All-over striped print", "Soft hand feel for everyday wear"],
    details: ["Straight fit", "Clean crew neckline", "Pairs easily with denim and boots"],
    images: [
      [`${P}/red-stripes-shirt.jpg`, "Red and white striped 250 Years shirt with 1776 and 2026 text."],
      [`${C}/04-lifestyle-product-shot-redline-250-shirt.webp`, "Redline 250 Shirt lifestyle shot"],
      [`${C}/08-couple-shot-redline-250-shirt-and-liberty-eagle-hoodie.webp`, "Couple wearing the Redline 250 Shirt and Liberty Eagle Hoodie"],
    ],
  },
  {
    sku: "WEAR-005", slug: "45-47-tribute-crewneck", name: "45-47 Tribute Crewneck",
    subtitle: "Commemorative patriotic crewneck", price_cents: 15000, category: "garments", featured: false, sort: 4,
    badge: "Statement Piece", release_note: "Limited-run statement piece.",
    description: "Nobel Peace Prize Tribute Crewneck. A bold statement piece honoring a defining moment in history. This heavyweight crewneck features a striking patriotic graphic with a clean, premium finish. Built for those who wear conviction, not just clothing.",
    materials: ["Midweight fleece", "Large front patriotic graphic", "Soft rib finishes"],
    details: ["Secondary product slot", "Intentional limited placement", "Merchandised below the core assortment"],
    seo_title: "45-47 Tribute Crewneck",
    seo_description: "Nobel Peace Prize Tribute Crewneck. A bold statement piece honoring a defining moment in history.",
    images: [
      [`${P}/nobel-peace-sweater.jpg`, "45-47 Tribute Crewneck product image."],
      [`${C}/nobel-peace-sweater-chinese-male-editorial.jpg`, "Model wearing the 45-47 Tribute Crewneck"],
      [`${C}/nobel-peace-sweater-puerto-rican-female-editorial.jpg`, "Model wearing the 45-47 Tribute Crewneck"],
    ],
  },
  {
    sku: "WEAR-006", slug: "jacket-boots", name: "Jacket + Boots",
    subtitle: "Heritage outerwear and boot set", price_cents: 150000, category: "sets", featured: true, sort: 5, set: true,
    badge: "Featured set", release_note: "Limited-run numbered set.",
    description: "A premium set pairing the heritage jacket with leather boots for a complete look built with stronger texture, clean structure, and elevated Americana styling. Only 200,000 made in the world. 10 year warranty. Each set comes with its own patriot number.",
    materials: ["Structured heritage jacket", "Premium leather boots", "Built as a matched set"],
    details: ["Includes jacket and boots", "10 year warranty", "Numbered set release"],
    seo_title: "Jacket + Boots",
    seo_description: "Shop the Jacket + Boots set from True American Wear, a premium Americana pairing built around a heritage jacket and leather boots.",
    images: [
      [`${P}/jacket.jpg`, "True American Wear jacket standalone product image."],
      [`${P}/boots.jpg`, "True American Wear boots standalone product image."],
      [`${C}/jacket-boots-woman-editorial.jpg`, "Model styled in the Jacket + Boots set"],
      [`${C}/jacket-boots-harley-editorial.jpg`, "Model styled in the Jacket + Boots set beside a motorcycle"],
      [`${C}/jacket-boots-male-editorial.jpg`, "Male model wearing True American Wear jacket and boots"],
      [`${C}/jacket-boots-male-lifestyle.jpg`, "Male lifestyle image wearing True American Wear jacket and boots"],
    ],
  },
  {
    sku: "WEAR-007", slug: "founders-crewneck-1776-shoes-white", name: "Founders Crewneck 1776 + Shoes (White)",
    subtitle: "White crewneck and shoes set", price_cents: 35000, category: "sets", featured: false, sort: 6, set: true,
    badge: "Bundle offer", release_note: "Limited bundle release.",
    description: "A white set built around the Founders Crewneck 1776 and matching shoes, designed to bring a brighter, more elevated finish to the 250th Year Collection. Only 100,000 made in the world.",
    materials: ["White Founders 1776 crewneck", "Matching white shoes", "Coordinated set styling"],
    details: ["Includes crewneck and shoes", "Clean full-look pairing", "Built for standout contrast"],
    seo_title: "Founders Crewneck 1776 + Shoes (White)",
    seo_description: "Shop the Founders Crewneck 1776 + Shoes (White) set from True American Wear.",
    images: [
      [`${P}/flag-sweater-white.jpg`, "Founders Crewneck 1776 + Shoes (White) crewneck standalone product image."],
      [`${P}/shoes-white.jpg`, "Founders Crewneck 1776 + Shoes (White) shoe standalone product image."],
      [`${C}/founders-white-solo-editorial.jpg`, "Model wearing the Founders Crewneck 1776 + Shoes (White) set"],
      [`${C}/founders-white-couple-editorial.jpg`, "Couple featuring the Founders Crewneck 1776 + Shoes (White) set"],
    ],
  },
  {
    sku: "WEAR-008", slug: "founders-crewneck-1776-shoes-black", name: "Founders Crewneck 1776 + Shoes (Black)",
    subtitle: "Black crewneck and shoes set", price_cents: 35000, category: "sets", featured: false, sort: 7, set: true,
    badge: "Bundle offer", release_note: "Limited bundle release.",
    description: "A black set built around the Founders Crewneck 1776 and matching shoes, styled to deliver a complete heritage look with stronger contrast and structure. Only 100,000 made in the world.",
    materials: ["Black Founders 1776 crewneck", "Matching black shoes", "Coordinated set styling"],
    details: ["Includes crewneck and shoes", "Built as a full-look set", "Made for a stronger heritage finish"],
    seo_title: "Founders Crewneck 1776 + Shoes (Black)",
    seo_description: "Shop the Founders Crewneck 1776 + Shoes (Black) set from True American Wear.",
    images: [
      [`${P}/flag-sweater.jpg`, "Founders Crewneck 1776 + Shoes (Black) crewneck standalone product image."],
      [`${P}/shoes-black.jpg`, "Founders Crewneck 1776 + Shoes (Black) shoe standalone product image."],
      [`${C}/founders-black-solo-editorial.jpg`, "Model wearing the Founders Crewneck 1776 + Shoes (Black) set"],
      [`${C}/founders-black-couple-editorial.jpg`, "Couple featuring the Founders Crewneck 1776 + Shoes (Black) set"],
    ],
  },
];

async function main() {
  // Categories
  const cats = {};
  for (const [slug, name, sort] of [["garments", "Garments", 0], ["sets", "Sets", 1]]) {
    const { data, error } = await db
      .from("categories")
      .upsert({ slug, name, sort_order: sort }, { onConflict: "slug" })
      .select("id")
      .single();
    if (error) throw error;
    cats[slug] = data.id;
  }

  for (const p of PRODUCTS) {
    const { data: prod, error } = await db
      .from("products")
      .upsert(
        {
          sku: p.sku, slug: p.slug, name: p.name, subtitle: p.subtitle,
          description: p.description, category_id: cats[p.category],
          price_cents: p.price_cents, status: "active", featured: p.featured,
          free_shipping: Boolean(p.set), badge: p.badge, release_note: p.release_note,
          materials: p.materials, details: p.details, sort_order: p.sort,
          seo_title: p.seo_title ?? null, seo_description: p.seo_description ?? null,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error) throw error;

    // Sizes
    const sizes = p.set
      ? [
          ...GARMENT_SIZES.map((s, i) => ({ size: `garment:${s}`, sort_order: i })),
          ...SHOE_SIZES.map((s, i) => ({ size: `shoe:${s}`, sort_order: 100 + i })),
        ]
      : GARMENT_SIZES.map((s, i) => ({ size: s, sort_order: i }));
    const { error: sizeErr } = await db
      .from("product_sizes")
      .upsert(
        sizes.map((s) => ({ product_id: prod.id, ...s })),
        { onConflict: "product_id,size", ignoreDuplicates: true },
      );
    if (sizeErr) throw sizeErr;

    // Images (skip any already present by URL)
    const { data: existing } = await db
      .from("product_images")
      .select("public_url")
      .eq("product_id", prod.id);
    const have = new Set((existing ?? []).map((r) => r.public_url));
    const rows = p.images
      .map(([url, alt], i) => ({
        product_id: prod.id, public_url: url, alt,
        is_primary: i === 0, sort_order: i,
      }))
      .filter((r) => !have.has(r.public_url));
    if (rows.length) {
      const { error: imgErr } = await db.from("product_images").insert(rows);
      if (imgErr) throw imgErr;
    }
    console.log(`✓ ${p.slug} (${sizes.length} sizes, ${p.images.length} images)`);
  }

  // Welcome coupon
  const { error: cErr } = await db.from("coupons").upsert(
    {
      code: "FOUNDERS10",
      description: "Welcome — 10% off your first order",
      discount_type: "percent",
      discount_value: 10,
      active: true,
    },
    { onConflict: "code" },
  );
  if (cErr) throw cErr;
  console.log("✓ FOUNDERS10 coupon");
  console.log("done.");
}

main().catch((e) => {
  console.error("SEED FAILED:", e.message ?? e);
  process.exit(1);
});
