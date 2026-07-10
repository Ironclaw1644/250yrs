import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { AdminShell } from "@/components/admin/AdminShell";
import { ToastProvider } from "@/components/admin/Toast";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();
  const svc = db();
  const [reports, videos] = await Promise.all([
    svc.from("review_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    svc.from("business_videos").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return (
    <div className="theme-dark min-h-screen bg-night text-cloud">
      <ToastProvider>
        <AdminShell
          email={profile.email}
          badges={{ reviews: reports.count ?? 0, videos: videos.count ?? 0 }}
        >
          {children}
        </AdminShell>
      </ToastProvider>
    </div>
  );
}
