import "server-only";
import { redirect } from "next/navigation";
import { authConfigured, createServerSupabase } from "./supabase/server";

/**
 * Admin gate (bondandfifth model): a caller is admin iff Supabase-authenticated
 * AND their email is on the allowlist. auth.users is shared across all
 * WalkPerro tenants, so the email allowlist IS the boundary.
 */
function allowedEmails(): string[] {
  return (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminUser(): Promise<{ email: string } | null> {
  if (!authConfigured) return null;
  const allowed = allowedEmails();
  if (allowed.length === 0) return null;
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const email = user?.email?.toLowerCase();
    if (email && allowed.includes(email)) return { email };
    return null;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<{ email: string }> {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** Non-redirecting gate for server actions. */
export async function assertAdmin(): Promise<{ email: string }> {
  const admin = await getAdminUser();
  if (!admin) throw new Error("UNAUTHORIZED");
  return admin;
}
