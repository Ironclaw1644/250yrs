/**
 * Create (or reset) a TEMPORARY admin login you can hand to a client.
 *
 *   node scripts/create-temp-admin.mjs <email> <password> ["Full Name"]
 *
 * Creates a confirmed auth user, sets taw.profiles.role='admin'. If the user
 * already exists, its password is reset to the one provided.
 * The holder can change it later at /account/password.
 *
 * Delete when finished:
 *   node scripts/create-temp-admin.mjs --delete <email>
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

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});
const taw = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  db: { schema: "taw" },
  auth: { persistSession: false },
});

async function findUser(email) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function main() {
  if (process.argv[2] === "--delete") {
    const email = process.argv[3];
    const u = await findUser(email);
    if (!u) return console.log("not found:", email);
    await admin.auth.admin.deleteUser(u.id);
    return console.log("deleted:", email);
  }

  const [email, password, fullName] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: node scripts/create-temp-admin.mjs <email> <password> ["Full Name"]');
    process.exit(1);
  }

  let user = await findUser(email);
  if (user) {
    await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    console.log("existing user — password reset");
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName ?? "Temporary Admin" },
    });
    if (error) throw error;
    user = data.user;
    console.log("user created");
  }

  const { error } = await taw
    .from("profiles")
    .upsert({ id: user.id, email, full_name: fullName ?? "Temporary Admin", role: "admin" }, { onConflict: "id" });
  if (error) throw error;
  console.log(`role: admin  ·  ${email}  ·  ready at /admin`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
