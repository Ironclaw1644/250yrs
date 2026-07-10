import "server-only";
import { Resend } from "resend";
import { brand, siteUrl } from "./brand";

const apiKey = process.env.RESEND_API_KEY;
export const resendConfigured = Boolean(apiKey);

let _resend: Resend | null = null;
function resend(): Resend {
  if (!apiKey) throw new Error("RESEND_API_KEY missing");
  if (!_resend) _resend = new Resend(apiKey);
  return _resend;
}

/** From address: verified domain when configured, Resend sandbox otherwise. */
function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || "True American Where <onboarding@resend.dev>";
}

/** Bulletproof gold CTA button (table-based so every mail client renders it). */
export function emailButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 4px;">
    <tr><td style="background:#f0a818;border-radius:8px;">
      <a href="${href}" style="display:inline-block;padding:12px 26px;font-weight:700;font-size:15px;color:#06121d;text-decoration:none;">${label}</a>
    </td></tr>
  </table>`;
}

/** Branded HTML wrapper (navy header + gold rule + cream body + footer links). */
export function brandedTemplate(title: string, bodyHtml: string): string {
  const footerLink = (label: string, path: string) =>
    `<a href="${siteUrl}${path}" style="color:#5b5344;text-decoration:underline;">${label}</a>`;
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f5edda;font-family:'Public Sans',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5edda;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#0c2135;border-radius:12px 12px 0 0;padding:20px 28px;text-align:center;">
          <img src="${siteUrl}/brand/logo.png" alt="${brand.name}" height="48" style="height:48px;width:auto;" />
        </td></tr>
        <tr><td style="height:3px;background:#f0a818;"></td></tr>
        <tr><td style="background:#fbf6e9;padding:28px;border-radius:0 0 12px 12px;color:#1a1712;font-size:15px;line-height:1.6;">
          <h1 style="margin:0 0 12px;font-size:20px;color:#0c2135;">${title}</h1>
          ${bodyHtml}
          <p style="margin:28px 0 0;padding-top:14px;border-top:1px solid rgba(12,33,53,0.12);font-size:12px;color:#5b5344;">
            ${footerLink("Find businesses", "/us")} &nbsp;·&nbsp; ${footerLink("How it works", "/how-it-works")} &nbsp;·&nbsp; ${footerLink("Contact", "/contact")}
          </p>
          <p style="margin:8px 0 0;font-size:12px;color:#5b5344;">${brand.name} · ${siteUrl.replace("https://", "")}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** One-call branded notification email (title + body + optional gold CTA). */
export async function sendNotificationEmail({
  to,
  subject,
  title,
  bodyHtml,
  ctaLabel,
  ctaHref,
}: {
  to: string;
  subject: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cta = ctaLabel && ctaHref ? emailButton(ctaLabel, ctaHref) : "";
  return sendEmail({ to, subject, html: brandedTemplate(title, bodyHtml + cta) });
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resendConfigured) return { ok: false, error: "Email not configured" };
  try {
    const { error } = await resend().emails.send({
      from: fromAddress(),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
