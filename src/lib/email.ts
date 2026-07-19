import "server-only";
import { Resend } from "resend";
import { siteUrl } from "./seo";
import { formatCents } from "./store-config";
import type { OrderWithItems } from "./store-types";

const apiKey = process.env.RESEND_API_KEY;
export const resendConfigured = Boolean(apiKey);

let _resend: Resend | null = null;
function resend(): Resend {
  if (!apiKey) throw new Error("RESEND_API_KEY missing");
  if (!_resend) _resend = new Resend(apiKey);
  return _resend;
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || "True American Wear <onboarding@resend.dev>";
}

/** Dark-luxury branded wrapper matching the site (obsidian/gold/cream). */
export function wrapEmail(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0b0b0c;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0c;padding:28px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:0 28px 18px;text-align:center;">
          <img src="${siteUrl}/true-american-wear/logo.png" alt="True American Wear" height="64" style="height:64px;width:auto;" />
        </td></tr>
        <tr><td style="height:2px;background:#c7a46a;"></td></tr>
        <tr><td style="background:#17181b;padding:30px 28px;color:#ece4d6;font-size:15px;line-height:1.65;">
          <h1 style="margin:0 0 14px;font-size:24px;font-weight:600;color:#ece4d6;">${title}</h1>
          ${bodyHtml}
          <p style="margin:28px 0 0;padding-top:14px;border-top:1px solid rgba(236,228,214,0.15);font-size:12px;color:rgba(236,228,214,0.5);">
            True American Wear · 250th Year Collection · <a href="${siteUrl}" style="color:#c7a46a;">${siteUrl.replace("https://", "")}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function emailButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 6px;">
    <tr><td style="background:linear-gradient(135deg,#c7a46a,#8f6b3a);border-radius:999px;">
      <a href="${href}" style="display:inline-block;padding:12px 28px;font-family:Arial,sans-serif;font-weight:700;font-size:14px;color:#0b0b0c;text-decoration:none;">${label}</a>
    </td></tr>
  </table>`;
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

function itemsTable(order: OrderWithItems): string {
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid rgba(236,228,214,0.12);">${i.product_name}${
          i.size ? `<br/><span style="font-size:12px;color:rgba(236,228,214,0.6);">${i.size}</span>` : ""
        }</td>
        <td style="padding:8px 0;border-bottom:1px solid rgba(236,228,214,0.12);text-align:center;">×${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid rgba(236,228,214,0.12);text-align:right;">${formatCents(i.line_total_cents)}</td>
      </tr>`,
    )
    .join("");
  const totalRow = (label: string, cents: number, strong = false) =>
    `<tr><td colspan="2" style="padding:6px 0;text-align:right;color:rgba(236,228,214,0.7);">${label}</td>
     <td style="padding:6px 0;text-align:right;${strong ? "font-weight:700;color:#c7a46a;font-size:17px;" : ""}">${formatCents(cents)}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px;color:#ece4d6;">
    ${rows}
    ${totalRow("Subtotal", order.subtotal_cents)}
    ${totalRow("Shipping", order.shipping_cents)}
    ${order.discount_cents > 0 ? totalRow(`Discount${order.discount_code ? ` (${order.discount_code})` : ""}`, -order.discount_cents) : ""}
    ${totalRow("Total", order.total_cents, true)}
  </table>`;
}

/** Customer confirmation + admin notification for a paid order. */
export async function sendOrderEmails(order: OrderWithItems): Promise<void> {
  if (!resendConfigured) return;
  const orderUrl = `${siteUrl}/order/${order.confirmation_token}`;
  await sendEmail({
    to: order.customer_email,
    subject: `Order confirmed — ${order.order_number}`,
    html: wrapEmail(
      "Your order is confirmed",
      `<p>Thank you, ${order.customer_name.split(" ")[0]} — your piece of the 250th Year Collection is on its way to fulfillment.</p>
       <p style="margin:8px 0 0;color:rgba(236,228,214,0.7);">Order <strong style="color:#c7a46a;">${order.order_number}</strong></p>
       ${itemsTable(order)}
       ${emailButton("View your order", orderUrl)}`,
    ),
  });
  const adminTo = process.env.EMAIL_TO_ADMIN;
  if (adminTo) {
    await sendEmail({
      to: adminTo,
      subject: `New order ${order.order_number} — ${formatCents(order.total_cents)}`,
      html: wrapEmail(
        "New order received",
        `<p><strong>${order.customer_name}</strong> (${order.customer_email}) just placed <strong>${order.order_number}</strong>.</p>
         ${itemsTable(order)}
         <p style="font-size:13px;color:rgba(236,228,214,0.7);">Ship to: ${
           order.shipping_address
             ? Object.values(order.shipping_address).filter(Boolean).join(", ")
             : "—"
         }</p>`,
      ),
      replyTo: order.customer_email,
    });
  }
}

/** Welcome email with the newsletter coupon. */
export async function sendWelcomeEmail(to: string, unsubscribeToken: string): Promise<void> {
  if (!resendConfigured) return;
  await sendEmail({
    to,
    subject: "Welcome — here's 10% off your first order",
    html: wrapEmail(
      "Welcome to the list",
      `<p>You're on the founders list for the 250th Year Collection — first notice on drops, restocks, and numbered sets.</p>
       <p style="margin:18px 0 4px;color:rgba(236,228,214,0.7);">Your welcome code:</p>
       <p style="margin:0;font-family:Arial,sans-serif;font-size:24px;font-weight:800;letter-spacing:0.08em;color:#c7a46a;">FOUNDERS10</p>
       ${emailButton("Shop the collection", `${siteUrl}/shop`)}
       <p style="margin:18px 0 0;font-size:12px;color:rgba(236,228,214,0.45);"><a href="${siteUrl}/unsubscribe?token=${unsubscribeToken}" style="color:rgba(236,228,214,0.45);">Unsubscribe</a></p>`,
    ),
  });
}
