"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/supabase";
import { assertAdmin } from "@/lib/auth";
import { isValidCopyKey } from "@/lib/copy-registry";
import { audit } from "@/lib/audit";

/** Persist one editable copy value. Admin-only; whitelisted keys only. */
export async function updateCopy(
  key: string,
  value: string,
): Promise<{ ok: boolean; error?: string }> {
  let admin;
  try {
    admin = await assertAdmin();
  } catch {
    return { ok: false, error: "Not authorized" };
  }
  if (!isValidCopyKey(key)) return { ok: false, error: "Invalid key" };

  const { error } = await db()
    .from("site_content")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };

  void audit(admin.id, "content.update", "site_content", null, { key });
  revalidateTag("site-content");
  revalidatePath("/", "layout");
  return { ok: true };
}
