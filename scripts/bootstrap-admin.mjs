/**
 * Bootstrap the first admin account.
 *   node scripts/bootstrap-admin.mjs <email> [redirect-base-url]
 * Creates the auth user if missing (confirmed), sets taw.profiles.role='admin',
 * and sends a password-recovery email so the person sets their own password.
 * No passwords are generated or printed.
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

const email = process.argv[2];
const base = (process.argv[3] || env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
if (!email) {
  console.error("Usage: node scripts/bootstrap-admin.mjs <email> [redirect-base-url]");
  process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

async function main() {
  // 1) create (or find) the auth user
  let userId = null;
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createErr) {
    if (!/already|exists|registered/i.test(createErr.message)) throw createErr;
    const { data: list } = await supabase.auth.admin.listUsers({ perPage: 500 });
    userId = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
    console.log("user exists:", Boolean(userId));
  } else {
    userId = created.user?.id ?? null;
    console.log("user created");
  }
  if (!userId) throw new Error("could not resolve user id");

  // 2) profile role = admin (trigger may have created the row already)
  const taw = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    db: { schema: "taw" },
    auth: { persistSession: false },
  });
  const { error: upErr } = await taw
    .from("profiles")
    .upsert({ id: userId, email, role: "admin" }, { onConflict: "id" });
  if (upErr) throw upErr;
  console.log("role set: admin");

  // 3) recovery email so they set their own password
  const { error: linkErr } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/callback?next=/admin`,
  });
  if (linkErr) console.warn("recovery email failed:", linkErr.message);
  else console.log(`recovery email sent to ${email} (redirect → ${base}/admin)`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
