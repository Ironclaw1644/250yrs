import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="grid min-h-[60vh] place-items-center px-6 py-20">
        <div className="max-w-md space-y-5 text-center">
          <p className="eyebrow">404</p>
          <h1 className="font-display text-5xl text-brand-cream">
            This page rode off.
          </h1>
          <p className="text-white/60">
            The page you&apos;re after doesn&apos;t exist — but the collection does.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="button-primary">
              Shop the collection
            </Link>
            <Link href="/" className="button-secondary">
              Back home
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
