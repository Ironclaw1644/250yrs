import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db, dbConfigured } from "./supabase/admin";

/**
 * Simple DB-backed rate limiter (bondandfifth model): hashed IP per bucket,
 * counted over a sliding window. Fails OPEN — a limiter outage must never
 * block a real customer.
 */
export async function rateLimited(
  bucket: string,
  max = 8,
  windowMinutes = 10,
): Promise<boolean> {
  if (!dbConfigured) return false;
  try {
    const h = await headers();
    const ip =
      h.get("x-real-ip") ??
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 32);
    const svc = db();
    const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
    const { count } = await svc
      .from("rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("bucket", bucket)
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if ((count ?? 0) >= max) return true;
    await svc.from("rate_limits").insert({ bucket, ip_hash: ipHash });
    return false;
  } catch {
    return false;
  }
}
