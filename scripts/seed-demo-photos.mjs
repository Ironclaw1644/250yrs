/**
 * Point demo businesses at their generated photos.
 * For each is_demo business with /images/demo/<slug>-{1,2,3}.webp on disk:
 * delete existing demo photo rows, insert 3 rows (first = primary).
 * Idempotent (delete-then-insert).
 *
 *   node scripts/seed-demo-photos.mjs
 */
import { readFileSync, existsSync } from "node:fs";
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
  db: { schema: "taw" },
  auth: { persistSession: false },
});

const SHOT_ALTS = [
  (b) => `${b.name} storefront`,
  (b) => `Inside ${b.name}`,
  (b) => `Signature offering at ${b.name}`,
];

async function main() {
  const { data: businesses, error } = await db
    .from("businesses")
    .select("id,slug,name")
    .eq("is_demo", true);
  if (error) throw error;

  for (const b of businesses ?? []) {
    const rows = [];
    for (let i = 1; i <= 3; i++) {
      const rel = `/images/demo/${b.slug}-${i}.webp`;
      if (!existsSync(join(root, "public", rel))) continue;
      rows.push({
        business_id: b.id,
        url: rel,
        alt_text: SHOT_ALTS[i - 1](b),
        is_primary: i === 1,
        is_demo: true,
        sort_order: i - 1,
      });
    }
    if (!rows.length) {
      console.log(`SKIP ${b.slug} (no generated files)`);
      continue;
    }
    await db.from("business_photos").delete().eq("business_id", b.id).eq("is_demo", true);
    const { error: insErr } = await db.from("business_photos").insert(rows);
    console.log(insErr ? `FAIL ${b.slug}: ${insErr.message}` : `OK   ${b.slug} (${rows.length} photos)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
