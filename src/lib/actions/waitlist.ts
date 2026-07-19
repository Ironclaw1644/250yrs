"use server";

import { db, dbConfigured } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email";
import { rateLimited } from "@/lib/rate-limit";

export type WaitlistResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Waitlist → the subscribers table (bondandfifth model) + a welcome email
 * carrying the FOUNDERS10 code. Re-subscribes are treated as success.
 */
export async function joinWaitlist(input: {
  name: string;
  email: string;
  interest?: string;
  /** Honeypot. */
  company?: string;
}): Promise<WaitlistResult> {
  if (input.company) return { ok: true }; // silently drop bots
  const email = input.email?.trim().toLowerCase();
  const name = input.name?.trim();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { ok: false, error: "Enter a valid email." };
  if (!dbConfigured) return { ok: false, error: "The list isn't open yet — try again soon." };
  if (await rateLimited("waitlist", 6, 10))
    return { ok: false, error: "Too many attempts — give it a few minutes." };

  const svc = db();
  const { data: existing } = await svc
    .from("subscribers")
    .select("id, status, unsubscribe_token")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    if (existing.status !== "subscribed") {
      await svc
        .from("subscribers")
        .update({ status: "subscribed", name: name || null })
        .eq("id", existing.id);
    }
    return { ok: true };
  }

  const { data: created, error } = await svc
    .from("subscribers")
    .insert({
      email,
      name: name || null,
      source: input.interest?.slice(0, 120) || "waitlist",
    })
    .select("unsubscribe_token")
    .single();
  if (error) return { ok: false, error: "Could not join the list — try again." };

  void sendWelcomeEmail(email, created.unsubscribe_token).catch(() => {});
  return { ok: true };
}

/** One-click unsubscribe by token. */
export async function unsubscribe(token: string): Promise<boolean> {
  if (!dbConfigured || !token) return false;
  const { data } = await db()
    .from("subscribers")
    .update({ status: "unsubscribed" })
    .eq("unsubscribe_token", token)
    .select("id")
    .maybeSingle();
  return Boolean(data);
}
