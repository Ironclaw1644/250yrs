import { getAllCopy } from "@/lib/content";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettings() {
  const copy = await getAllCopy();
  const settings: Record<string, string> = {};
  const images: Record<string, string> = {};
  for (const [k, v] of Object.entries(copy)) {
    if (k.startsWith("site.")) settings[k] = v;
    if (k.startsWith("img.")) images[k] = v;
  }
  return (
    <div>
      <h1 className="mb-5 font-heading text-h1">Settings</h1>
      <SettingsForm settings={settings} images={images} />
    </div>
  );
}
