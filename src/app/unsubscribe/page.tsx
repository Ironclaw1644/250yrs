import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { unsubscribe } from "@/lib/actions/waitlist";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const ok = token ? await unsubscribe(token) : false;

  return (
    <>
      <SiteHeader />
      <main className="pb-20 pt-10">
        <section className="container-shell">
          <div className="section-shell mx-auto max-w-xl space-y-5 py-14 text-center">
            <h1 className="font-display text-4xl text-brand-cream">
              {ok ? "You're unsubscribed." : "Link not recognized."}
            </h1>
            <p className="text-white/65">
              {ok
                ? "You won't hear from us again — though the 250th year only comes once."
                : "This unsubscribe link is invalid or was already used."}
            </p>
            <Link href="/" className="button-secondary inline-flex">
              Back to the site
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
