import "server-only";
import { db } from "./supabase";
import { sendNotificationEmail, resendConfigured } from "./email";
import { siteUrl } from "./brand";

export type NotificationType =
  | "welcome"
  | "review_received"
  | "owner_response"
  | "business_status"
  | "subscription"
  | "video_status"
  | "credits";

/**
 * The one hub every product event routes through: writes the in-app
 * notification and (optionally) the matching branded email. Fire-and-forget —
 * like audit(), it must never break the action that called it.
 */
export async function notify(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
  /** Email counterpart; skipped when Resend isn't configured. */
  email?: { subject: string; bodyHtml: string; ctaLabel?: string; ctaHref?: string };
  /** Recipient address if the caller already has it (saves a lookup). */
  toEmail?: string;
}): Promise<void> {
  try {
    const insert = db()
      .from("notifications")
      .insert({
        user_id: opts.userId,
        type: opts.type,
        title: opts.title,
        body: opts.body ?? null,
        href: opts.href ?? null,
      });
    // Welcome rows are deduped by a partial unique index; ignore that conflict.
    const { error } = await insert;
    if (error && opts.type === "welcome") return; // already welcomed
    if (error) console.error("[notify]", error.message);

    if (opts.email && resendConfigured) {
      let to = opts.toEmail;
      if (!to) {
        const { data } = await db().auth.admin.getUserById(opts.userId);
        to = data.user?.email ?? undefined;
      }
      if (to) {
        const href = opts.email.ctaHref?.startsWith("/")
          ? `${siteUrl}${opts.email.ctaHref}`
          : opts.email.ctaHref;
        await sendNotificationEmail({
          to,
          subject: opts.email.subject,
          title: opts.title,
          bodyHtml: opts.email.bodyHtml,
          ctaLabel: opts.email.ctaLabel,
          ctaHref: href,
        });
      }
    }
  } catch (e) {
    console.error("[notify]", (e as Error).message);
  }
}
