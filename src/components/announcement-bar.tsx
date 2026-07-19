import { getAllCopy } from "@/lib/store-queries";

/** Thin gold announcement strip driven by the admin's site.announcement key. */
export async function AnnouncementBar() {
  const copy = await getAllCopy();
  const raw = copy["site.announcement"];
  let text = "";
  try {
    text = raw ? (JSON.parse(raw) as string) : "";
  } catch {
    text = raw ?? "";
  }
  if (!text.trim()) return null;
  return (
    <div className="bg-gradient-to-r from-brand-bronze via-brand-gold to-brand-bronze px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand-obsidian">
      {text}
    </div>
  );
}
