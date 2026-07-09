"use server";

import { sendEmail, brandedTemplate, resendConfigured } from "@/lib/email";
import { getSetting } from "@/lib/content";
import { brand } from "@/lib/brand";

export type ContactResult = { ok: boolean; error?: string };

export async function submitContact(
  _prev: ContactResult | null,
  formData: FormData,
): Promise<ContactResult> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();
  // simple honeypot
  if (String(formData.get("company") || "")) return { ok: true };
  if (!name || !email || !message) {
    return { ok: false, error: "Please fill in your name, email, and message." };
  }
  if (!resendConfigured) {
    return { ok: false, error: "unconfigured" };
  }
  const to = await getSetting("site.contact_email", brand.email);
  const res = await sendEmail({
    to,
    replyTo: email,
    subject: `Contact form: ${name}`,
    html: brandedTemplate(
      "New message from the contact form",
      `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
       <p style="white-space:pre-wrap;">${message
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .slice(0, 5000)}</p>`,
    ),
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}
