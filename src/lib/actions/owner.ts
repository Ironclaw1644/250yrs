"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

/** Upgrade a customer to business_owner (never touches admins) and start onboarding. */
export async function startBusiness() {
  const user = await requireUser("/dashboard/new");
  await db()
    .from("profiles")
    .update({ role: "business_owner" })
    .eq("id", user.id)
    .eq("role", "customer");
  redirect("/dashboard/new");
}

/** Create a draft listing owned by the current user (find-or-create its geo). */
export async function createListing(formData: FormData) {
  const user = await requireUser("/dashboard/new");
  const svc = db();
  // Ensure the creator is at least a business_owner (customers get upgraded).
  await svc
    .from("profiles")
    .update({ role: "business_owner" })
    .eq("id", user.id)
    .eq("role", "customer");

  const name = String(formData.get("name") || "").trim();
  const categorySlug = String(formData.get("category") || "");
  const cityName = String(formData.get("city") || "").trim();
  const stateName = String(formData.get("state") || "").trim();
  const stateCode = String(formData.get("state_code") || "").trim().toUpperCase();
  const countryName = String(formData.get("country") || "United States").trim();
  const phone = String(formData.get("phone") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const tagline = String(formData.get("tagline") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name || !categorySlug || !cityName || !stateName) {
    redirect("/dashboard/new?error=missing");
  }

  const cn = countryName.toLowerCase();
  const countrySlug =
    cn === "usa" || cn === "us" || cn.includes("united states")
      ? "us"
      : slugify(countryName);

  let { data: country } = await svc
    .from("countries")
    .select("id")
    .eq("slug", countrySlug)
    .maybeSingle();
  if (!country) {
    const ins = await svc
      .from("countries")
      .insert({
        code: countrySlug === "us" ? "US" : countrySlug.toUpperCase().slice(0, 2),
        name: countrySlug === "us" ? "United States" : countryName,
        slug: countrySlug,
      })
      .select("id")
      .single();
    country = ins.data;
  }

  const stateSlug = slugify(stateName);
  let { data: state } = await svc
    .from("states")
    .select("id")
    .eq("country_id", country!.id)
    .eq("slug", stateSlug)
    .maybeSingle();
  if (!state) {
    const ins = await svc
      .from("states")
      .insert({
        country_id: country!.id,
        name: stateName,
        slug: stateSlug,
        code: stateCode || null,
      })
      .select("id")
      .single();
    state = ins.data;
  }

  const citySlug = slugify(cityName);
  let { data: city } = await svc
    .from("cities")
    .select("id")
    .eq("state_id", state!.id)
    .eq("slug", citySlug)
    .maybeSingle();
  if (!city) {
    const ins = await svc
      .from("cities")
      .insert({ state_id: state!.id, name: cityName, slug: citySlug })
      .select("id")
      .single();
    city = ins.data;
  }

  const { data: cat } = await svc
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle();
  if (!cat) redirect("/dashboard/new?error=category");

  const slug = `${slugify(`${name}-${cityName}`)}-${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await svc.from("businesses").insert({
    owner_id: user.id,
    city_id: city!.id,
    category_id: cat!.id,
    name,
    slug,
    tagline: tagline || null,
    description: description || null,
    address_line1: address || null,
    phone: phone || null,
    status: "draft",
    plan_tier: "free",
    is_demo: false,
  });
  if (error) redirect("/dashboard/new?error=save");
  redirect("/dashboard");
}
