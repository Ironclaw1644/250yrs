/**
 * Generate the two EXAMPLE TV-spot videos used on the homepage showcase and
 * the /tv-spots marketing page. Idempotent — skips files that already exist
 * (use --force to regenerate).
 *
 *   node scripts/generate-example-spots.mjs
 *
 * 1) example-motion.mp4  — $0. ffmpeg Ken Burns montage over existing demo
 *    photos + navy logo end-card. This IS what the "Motion" tier looks like.
 * 2) example-premium.mp4 — Veo 3.1 (GOOGLE_API_KEY, ~$3.20 for one 8s clip),
 *    a cinematic small-business commercial. This sells the "Premium AI" tier.
 *
 * Output: public/videos/example-{motion,premium}.mp4 + *-poster.jpg
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "public", "videos");
const FORCE = process.argv.includes("--force");
mkdirSync(OUT, { recursive: true });

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

function ffmpeg(args) {
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    stdio: ["ignore", "inherit", "inherit"],
  });
}

function poster(mp4, jpg, at = "00:00:01") {
  ffmpeg(["-ss", at, "-i", mp4, "-frames:v", "1", "-q:v", "4", jpg]);
}

function report(path) {
  const kb = Math.round(statSync(path).size / 1024);
  console.log(`  ✓ ${path.replace(root + "/", "")} (${kb} KB)`);
}

/* ---------------- Motion example (ffmpeg only) ---------------- */
async function motionExample() {
  const out = join(OUT, "example-motion.mp4");
  if (existsSync(out) && !FORCE) return console.log("motion: exists, skipping");
  console.log("motion: rendering Ken Burns montage…");

  const photos = [
    "miss-rubys-fry-house-berea-1.webp",
    "miss-rubys-fry-house-berea-2.webp",
    "miss-rubys-fry-house-berea-3.webp",
  ].map((f) => join(root, "public", "images", "demo", f));
  const logo = join(root, "public", "brand", "logo.png");

  // Per-photo Ken Burns clip: 4.5s each @ 25fps, alternating zoom direction.
  const SEG = 4.5;
  const FPS = 25;
  const frames = Math.round(SEG * FPS);
  const zoom = (i) =>
    i % 2 === 0
      ? `zoompan=z='min(1.0015*zoom+0.0008,1.18)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1280x720:fps=${FPS}`
      : `zoompan=z='if(eq(on,1),1.18,max(zoom-0.0009,1.0))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1280x720:fps=${FPS}`;

  const inputs = photos.flatMap((p) => ["-loop", "1", "-t", String(SEG), "-i", p]);
  // End card: logo centered on navy for 3.5s.
  inputs.push("-f", "lavfi", "-t", "3.5", "-i", `color=c=0x06121d:s=1280x720:r=${FPS}`);
  inputs.push("-loop", "1", "-t", "3.5", "-i", logo);

  const X = 1; // crossfade seconds
  const filter = [
    `[0:v]scale=1600:-2,${zoom(0)},setsar=1[v0]`,
    `[1:v]scale=1600:-2,${zoom(1)},setsar=1[v1]`,
    `[2:v]scale=1600:-2,${zoom(2)},setsar=1[v2]`,
    `[4:v]scale=560:-2[lg]`,
    `[3:v][lg]overlay=(W-w)/2:(H-h)/2,setsar=1[card]`,
    `[v0][v1]xfade=transition=fade:duration=${X}:offset=${SEG - X}[x1]`,
    `[x1][v2]xfade=transition=fade:duration=${X}:offset=${2 * (SEG - X)}[x2]`,
    `[x2][card]xfade=transition=fade:duration=${X}:offset=${3 * (SEG - X)}[out]`,
  ].join(";");

  ffmpeg([
    ...inputs,
    "-filter_complex", filter,
    "-map", "[out]",
    "-c:v", "libx264", "-crf", "26", "-preset", "medium",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
    out,
  ]);
  poster(out, join(OUT, "example-motion-poster.jpg"), "00:00:02");
  report(out);
  report(join(OUT, "example-motion-poster.jpg"));
}

/* ---------------- Premium example (Veo 3.1) ---------------- */
const VEO_MODEL = "veo-3.1-generate-preview";
const PROMPT =
  "Cinematic 8-second TV commercial for a beloved small-town American diner at golden hour. " +
  "Opening: slow dolly-in across a warm neon-lit storefront on a classic main street, American flag " +
  "gently waving. Cut to sizzling fried chicken and golden cornbread on a checkered table, steam rising, " +
  "shallow depth of field. Final shot: smiling owner in an apron flips the OPEN sign, warm light spilling " +
  "onto the sidewalk. Warm amber and deep navy color grade, film grain, anamorphic lens flares, " +
  "heartfelt Americana mood. No on-screen text, no captions, no watermarks.";

async function premiumExample() {
  const out = join(OUT, "example-premium.mp4");
  if (existsSync(out) && !FORCE) return console.log("premium: exists, skipping");
  if (!KEY) throw new Error("GOOGLE_API_KEY missing");
  console.log(`premium: requesting ${VEO_MODEL} generation…`);

  const start = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${VEO_MODEL}:predictLongRunning`,
    {
      method: "POST",
      headers: { "x-goog-api-key": KEY, "content-type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: PROMPT }],
        parameters: { aspectRatio: "16:9", resolution: "720p" },
      }),
    },
  );
  if (!start.ok) throw new Error(`start failed: ${start.status} ${(await start.text()).slice(0, 300)}`);
  const { name } = await start.json();
  console.log("premium: operation started, polling…");

  let uri = null;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 10_000));
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${name}`, {
      headers: { "x-goog-api-key": KEY },
    });
    const op = await res.json();
    if (op.error) throw new Error(`operation error: ${JSON.stringify(op.error).slice(0, 300)}`);
    if (op.done) {
      uri =
        op.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ??
        op.response?.generatedVideos?.[0]?.video?.uri ??
        null;
      break;
    }
    process.stdout.write(".");
  }
  console.log("");
  if (!uri) throw new Error("no video URI in completed operation");

  console.log("premium: downloading…");
  const dl = await fetch(uri, { headers: { "x-goog-api-key": KEY } });
  if (!dl.ok) throw new Error(`download failed: ${dl.status}`);
  const raw = join(OUT, ".example-premium-raw.mp4");
  writeFileSync(raw, Buffer.from(await dl.arrayBuffer()));

  // Re-encode for web (seamless loop poster + faststart + strip audio).
  ffmpeg([
    "-i", raw,
    "-c:v", "libx264", "-crf", "26", "-preset", "medium",
    "-vf", "scale=1280:-2",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
    out,
  ]);
  execFileSync("rm", [raw]);
  poster(out, join(OUT, "example-premium-poster.jpg"));
  report(out);
  report(join(OUT, "example-premium-poster.jpg"));
}

async function main() {
  await motionExample();
  await premiumExample();
  console.log("done.");
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
