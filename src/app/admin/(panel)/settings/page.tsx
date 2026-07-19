import { SettingsForm } from "@/components/admin/settings-form";
import { adminSettings } from "@/lib/admin-queries";

export default async function AdminSettingsPage() {
  const settings = await adminSettings();
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Site copy & settings</p>
        <h1 className="font-display text-4xl text-brand-cream">Edit the site&apos;s words</h1>
        <p className="mt-1 max-w-xl text-sm text-white/50">
          These fields drive the live pages — hero headlines, the trust strip, and the
          announcement bar. Changes appear within about a minute.
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
