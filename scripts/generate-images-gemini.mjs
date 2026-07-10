/**
 * Backfill demo photos with Google's Nano Banana 2 (gemini-3-pro-image).
 * Generates only assets missing from public/images/demo (idempotent; --force to regen).
 *
 *   node scripts/generate-images-gemini.mjs
 */
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

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
const KEY = env.GOOGLE_API_KEY;
if (!KEY) {
  console.error("GOOGLE_API_KEY missing (.env.local)");
  process.exit(1);
}

const MODELS = [
  "gemini-3-pro-image",
  "nano-banana-pro-preview",
  "gemini-3.1-flash-image",
  "gemini-2.5-flash-image",
];
const FORCE = process.argv.includes("--force");

const STYLE =
  "Warm Americana photography, natural late-afternoon light, subtle film grain, rich color palette harmonizing with deep navy #0C2135 and antique gold #F0A818, photographic realism, editorial quality. No text, no lettering, no signage words, no watermarks.";

const ASSETS = [
  { name: "dons-tire-service-berea-1", prompt: "Inviting exterior storefront of a small tire shop business in a small Kentucky town, brick facade with awning, stacked tires visible by the garage bay" },
  { name: "dons-tire-service-berea-2", prompt: "Interior service bay of a busy small-town tire shop, car on a lift, warm work lights, authentic and lived-in" },
  { name: "dons-tire-service-berea-3", prompt: "Close-up of fresh new tires stacked in a tire shop, dramatic warm side light, shallow depth of field" },
  { name: "kingston-kutz-jm-1", prompt: "Inviting exterior storefront of a small barber shop in Kingston, Jamaica, colorful Caribbean facade with awning, warm tropical evening light" },
  { name: "kingston-kutz-jm-2", prompt: "Interior of a lively barber shop in Kingston, Jamaica, barber chairs and mirrors, warm lights, authentic and lived-in" },
  { name: "kingston-kutz-jm-3", prompt: "Close-up of a fresh fade haircut in progress at a Jamaican barber shop, clippers in hand, shallow depth of field" },
  { name: "fade-factory-berea-3", prompt: "Close-up of professional barber clippers and combs arranged on a station at a family barber shop, warm light, shallow depth of field" },
];

async function generateOne(prompt, modelIdx = 0) {
  const model = MODELS[modelIdx];
  if (!model) throw new Error("all models failed");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${prompt}. ${STYLE}` }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: "3:2" },
        },
      }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    if ((res.status === 404 || /not.?found|unsupported/i.test(err)) && modelIdx + 1 < MODELS.length) {
      console.warn(`  ${model} unavailable -> ${MODELS[modelIdx + 1]}`);
      return generateOne(prompt, modelIdx + 1);
    }
    throw new Error(`API ${res.status}: ${err.slice(0, 240)}`);
  }
  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part) throw new Error(`no image in response: ${JSON.stringify(data).slice(0, 200)}`);
  return { buf: Buffer.from(part.inlineData.data, "base64"), model };
}

async function run() {
  mkdirSync(join(root, "public", "images", "demo"), { recursive: true });
  let ok = 0, fail = 0;
  for (const asset of ASSETS) {
    const outPath = join(root, "public", "images", "demo", `${asset.name}.webp`);
    if (!FORCE && existsSync(outPath)) {
      console.log(`SKIP ${asset.name}`);
      continue;
    }
    let attempt = 0;
    for (;;) {
      try {
        const { buf, model } = await generateOne(asset.prompt);
        await sharp(buf).resize(1200, 800, { fit: "cover" }).webp({ quality: 72 }).toFile(outPath);
        console.log(`OK   ${asset.name} (${model})`);
        ok++;
        break;
      } catch (e) {
        attempt++;
        if (attempt > 3) {
          console.error(`FAIL ${asset.name}: ${e.message.slice(0, 200)}`);
          fail++;
          break;
        }
        const wait = 3000 * attempt;
        console.warn(`  retry ${attempt} for ${asset.name} in ${wait}ms (${e.message.slice(0, 120)})`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  console.log(`\nDone: ${ok} generated, ${fail} failed.`);
  if (fail) process.exit(2);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
