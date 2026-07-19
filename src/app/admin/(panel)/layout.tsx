import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { SignOutButton } from "@/components/admin/sign-out-button";

export const metadata: Metadata = {
  title: "Store Admin",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/settings", label: "Site copy & settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/8 bg-black/30 p-5 lg:flex">
        <Link href="/admin" className="mb-8 flex items-center gap-3">
          <div className="relative h-10 w-10">
            <Image src="/true-american-wear/logo.png" alt="" fill className="object-contain" />
          </div>
          <span className="text-xs uppercase tracking-[0.24em] text-brand-gold/80">
            Store admin
          </span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-brand-cream"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2 pt-6 text-sm">
          <Link href="/" className="block text-white/50 hover:text-brand-cream">
            ← Open store
          </Link>
          <SignOutButton />
          <p className="truncate text-xs text-white/35">{admin.email}</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto border-b border-white/8 bg-black/30 px-4 py-3 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="shrink-0 text-xs uppercase tracking-wide text-white/70 hover:text-brand-gold">
              {n.label}
            </Link>
          ))}
        </div>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
