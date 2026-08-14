/**
 * True American Where — brand image generation (gpt-image-2).
 *
 * Generates all site imagery (hero, category tiles, demo-business photos,
 * marketing, OG) with the OpenAI Images API, optimizes with sharp, and writes
 * WebP (JPEG for OG) into public/images/{hero,categories,demo,marketing}/.
 *
 * Idempotent: skips assets whose output file already exists (pass --force to
 * regenerate). Concurrency 2 with exponential backoff.
 *
 *   node scripts/generate-images.mjs [--force] [--only hero|categories|demo|marketing]
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ---- env (.env.local, no printing of values) ----
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
const OPENAI_API_KEY = env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY missing (.env.local)");
  process.exit(1);
}
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SECRET_KEY;

const FORCE = process.argv.includes("--force");
const onlyIdx = process.argv.indexOf("--only");
const ONLY = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;

const MODELS = ["gpt-image-2", "gpt-image-1.5", "gpt-image-1"];

const STYLE =
  "Warm Americana, natural late-afternoon light, subtle film grain, rich color palette that harmonizes with deep navy #0C2135 and antique gold #F0A818, photographic realism, editorial quality, no text, no lettering, no signage words, no watermarks";

// ---- asset manifest ----
const CATEGORY_PROMPTS = {
  "fried-food": "basket of golden fried catfish, chicken wings and hushpuppies on red-checkered paper, appetizing close-up",
  "soul-food": "heaping soul food plate with collard greens, mac and cheese and cornbread on a diner table",
  "fish-markets": "fresh whole fish arranged on crushed ice at a market counter",
  "grocery-markets": "wooden produce crates and stocked shelves in a corner grocery store",
  "food-trucks": "colorful food truck service window with steam rising from the grill",
  "hair-salons": "salon chair and round mirror with warm styling lights",
  "barber-shops": "vintage leather barber chair with clippers and a barber pole reflection in the mirror",
  "tire-shops": "stacked new tires and a car lift bay in a working garage",
  "car-washes": "foam and water sheeting off a clean car in warm car-wash tunnel light",
  "clothing-stores": "racked denim jackets and flannel shirts in a boutique storefront window",
  "repair-shops": "wooden workbench with hand tools and a project mid-repair, warm shop light",
  "beauty-supply": "neatly stocked beauty supply shelves with hair products in warm light",
  bakeries: "crusty artisan loaves and a frosted layer cake on a bakery counter",
  "local-shops": "charming mom-and-pop porch-front general store with an awning at golden hour",
  "local-businesses": "row of varied independent small-business storefronts along a main street, welcoming and diverse",
};

const ASSETS = [
  {
    group: "hero",
    name: "hero-1",
    size: "1536x1024",
    out: { width: 1600, format: "webp", quality: 72 },
    prompt:
      "Golden-hour small-town American main street, brick storefronts with cloth awnings, warm glowing shop windows, dusk navy-blue sky, inviting and nostalgic",
  },
  {
    group: "hero",
    name: "hero-2",
    size: "1536x1024",
    out: { width: 1600, format: "webp", quality: 72 },
    prompt:
      "Warm classic American diner storefront window at blue hour, golden light spilling onto the sidewalk, navy dusk sky",
  },
  ...Object.entries(CATEGORY_PROMPTS).map(([slug, prompt]) => ({
    group: "categories",
    name: slug,
    size: "1024x1024",
    out: { width: 640, height: 640, format: "webp", quality: 70 },
    prompt,
  })),
  {
    group: "marketing",
    name: "advertise-1",
    size: "1536x1024",
    out: { width: 1400, format: "webp", quality: 72 },
    prompt:
      "Proud small-business owner seen from behind flipping a wooden OPEN sign on a glass shop door at sunrise, warm hopeful mood",
  },
  {
    group: "marketing",
    name: "advertise-2",
    size: "1536x1024",
    out: { width: 1400, format: "webp", quality: 72 },
    prompt:
      "Cozy shop counter scene with a card reader and a smartphone showing a map pin, hands exchanging a paper bag, warm bokeh background",
  },
  {
    group: "marketing",
    name: "og",
    size: "1536x1024",
    out: { width: 1200, height: 630, format: "jpeg", quality: 80 },
    prompt:
      "Wide cinematic montage of American main-street storefronts (diner, barber shop, market) at dusk with clean deep-navy negative space in the upper left, warm gold lighting",
  },
];

// Demo-business photos: 3 per business, templated from live DB rows.
async function demoAssets() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("Supabase env missing — skipping demo assets");
    return [];
  }
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/businesses?is_demo=eq.true&select=slug,name,category:categories(slug,name),city:cities(name,state:states(name,country:countries(code)))`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Accept-Profile": "taw" } },
  );
  const rows = await res.json();
  if (!Array.isArray(rows)) {
    console.warn("Could not load demo businesses:", rows?.message ?? rows);
    return [];
  }
  const shots = [
    (b, place) => `inviting exterior storefront of a small ${b.category?.name?.toLowerCase() ?? "local"} business in ${place}, brick facade with awning`,
    (b) => `interior counter and service area of a busy ${b.category?.name?.toLowerCase() ?? "local"} shop, warm lights, authentic and lived-in`,
    (b) => `signature offering of a ${b.category?.name?.toLowerCase() ?? "local"} business, appetizing product close-up, shallow depth of field`,
  ];
  return rows.flatMap((b) => {
    const country = b.city?.state?.country?.code === "JM" ? "Kingston, Jamaica" : "a small Kentucky town";
    return shots.map((fn, i) => ({
      group: "demo",
      name: `${b.slug}-${i + 1}`,
      size: "1536x1024",
      out: { width: 1200, height: 800, format: "webp", quality: 72 },
      prompt: fn(b, country),
    }));
  });
}

// ---- generation ----
async function generateOne(asset, modelIdx = 0) {
  const model = MODELS[modelIdx];
  if (!model) throw new Error(`all models failed for ${asset.name}`);
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: `${asset.prompt}. ${STYLE}`,
      size: asset.size,
      quality: "high",
      n: 1,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    if (/model|not.?found|invalid/i.test(err) && modelIdx + 1 < MODELS.length) {
      console.warn(`  ${model} rejected -> trying ${MODELS[modelIdx + 1]}`);
      return generateOne(asset, modelIdx + 1);
    }
    throw new Error(`API ${res.status}: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("no b64 in response");
  return { buf: Buffer.from(b64, "base64"), model };
}

async function processOne(asset) {
  const ext = asset.out.format === "jpeg" ? "jpg" : asset.out.format;
  const outPath = join(root, "public", "images", asset.group, `${asset.name}.${ext}`);
  if (!FORCE && existsSync(outPath)) return { asset, skipped: true, outPath };
  mkdirSync(dirname(outPath), { recursive: true });

  let attempt = 0;
  for (;;) {
    try {
      const { buf, model } = await generateOne(asset);
      let img = sharp(buf).resize(asset.out.width, asset.out.height ?? null, {
        fit: asset.out.height ? "cover" : "inside",
        withoutEnlargement: true,
      });
      img = asset.out.format === "jpeg" ? img.jpeg({ quality: asset.out.quality }) : img.webp({ quality: asset.out.quality });
      await img.toFile(outPath);
      return { asset, skipped: false, outPath, model };
    } catch (e) {
      attempt++;
      if (attempt > 3) throw new Error(`${asset.name}: ${e.message}`);
      const wait = 2000 * 2 ** attempt;
      console.warn(`  retry ${attempt} for ${asset.name} in ${wait}ms (${e.message.slice(0, 120)})`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

async function run() {
  const all = [...ASSETS, ...(await demoAssets())].filter((a) => !ONLY || a.group === ONLY);
  console.log(`Generating ${all.length} assets (force=${FORCE})…`);
  const results = [];
  let i = 0;
  // concurrency 2
  await Promise.all(
    Array.from({ length: 2 }, async () => {
      while (i < all.length) {
        const asset = all[i++];
        try {
          const r = await processOne(asset);
          console.log(`${r.skipped ? "SKIP" : "OK  "} ${asset.group}/${asset.name}${r.model ? ` (${r.model})` : ""}`);
          results.push(r);
        } catch (e) {
          console.error(`FAIL ${asset.group}/${asset.name}: ${e.message.slice(0, 200)}`);
          results.push({ asset, failed: true });
        }
      }
    }),
  );
  const manifest = results
    .filter((r) => !r.failed)
    .map((r) => ({ group: r.asset.group, name: r.asset.name, path: r.outPath.replace(root + "/public", "") }));
  writeFileSync(join(root, "public", "images", "manifest.json"), JSON.stringify(manifest, null, 2));
  const failed = results.filter((r) => r.failed).length;
  console.log(`\nDone: ${manifest.length} ok, ${failed} failed.`);
  if (failed) process.exit(2);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
