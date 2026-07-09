import "server-only";
import { db } from "./supabase";

/** Append-only audit trail (fire-and-forget; never blocks the action). */
export async function audit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  diff: Record<string, unknown> = {},
): Promise<void> {
  try {
    await db().from("audit_log").insert({
      actor_id: actorId,
      action,
      entity,
      entity_id: entityId,
      diff,
    });
  } catch (e) {
    console.error("[audit]", (e as Error).message);
  }
}
