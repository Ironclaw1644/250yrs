import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabase, authConfigured } from "./supabase-server";
import { db } from "./supabase";

import type { Role } from "./auth-types";
export type { Role } from "./auth-types";
export interface Profile {
  id: string;
  role: Role;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
}

/** The signed-in auth user, or null. Safe when auth isn't configured. */
export async function getSessionUser(): Promise<User | null> {
  if (!authConfigured) return null;
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}

/** The signed-in user's profile (role, etc.), or null. Read via service client. */
export async function getProfile(): Promise<Profile | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const { data } = await db()
    .from("profiles")
    .select("id, role, full_name, display_name, phone")
    .eq("id", user.id)
    .maybeSingle();
  return {
    id: user.id,
    role: (data?.role as Role) ?? "customer",
    full_name: data?.full_name ?? null,
    display_name: data?.display_name ?? null,
    email: user.email ?? null,
    phone: data?.phone ?? null,
  };
}

export async function requireUser(next?: string): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return user;
}

export async function requireOwner(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/dashboard");
  if (profile.role !== "business_owner" && profile.role !== "admin") {
    // A customer who reaches an owner route hasn't started a business yet.
    redirect("/advertise");
  }
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/admin");
  if (profile.role !== "admin") redirect("/");
  return profile;
}

/**
 * Non-redirecting admin gate for use inside server actions (a redirect() in a
 * mutation corrupts the action response — throw instead and let callers map
 * it to an error result).
 */
export async function assertAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") throw new Error("UNAUTHORIZED");
  return profile;
}

/** Does the signed-in user own this business? (service-side check) */
export async function ownsBusiness(businessId: string): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  const { data } = await db()
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .maybeSingle();
  return Boolean(data);
}
