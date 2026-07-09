/**
 * Whitelist for editable site_content keys.
 *   copy.<page>.<section>.<field>  — text content
 *   img.<page>.<slot>              — image URLs (set via admin Settings)
 *   site.<setting>                 — site settings (contact email/phone, …)
 */
const COPY_KEY_RE =
  /^(copy\.(home|about|how|advertise|contact|footer)\.[a-z0-9_.]+|img\.[a-z0-9_.]+|site\.[a-z0-9_]+)$/;

export function isValidCopyKey(key: string): boolean {
  return COPY_KEY_RE.test(key) && key.length <= 120;
}
