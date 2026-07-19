import Image from "next/image";
import Link from "next/link";

import { CartButton } from "./cart-button";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-brand-obsidian/80 backdrop-blur-xl">
      <div className="container-shell relative flex items-center justify-between gap-4 py-3 sm:py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 sm:h-16 sm:w-16">
            <Image
              src="/true-american-wear/logo.png"
              alt="True American Wear logo"
              fill
              className="object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
            />
          </div>
          <div>
            <p className="font-display text-[1.35rem] leading-none text-brand-cream sm:text-[1.95rem]">
              True American Wear
            </p>
            <p className="mt-1 text-[0.6rem] uppercase tracking-[0.28em] text-brand-gold/70 sm:text-[0.68rem]">
              250th Year Collection
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-white/72 md:flex">
          <Link href="/shop" className="transition hover:text-brand-cream">
            Shop
          </Link>
          <Link href="/#collection" className="transition hover:text-brand-cream">
            Collection
          </Link>
          <Link href="/#campaign" className="transition hover:text-brand-cream">
            Campaign
          </Link>
          <Link href="/#founders-intake" className="transition hover:text-brand-cream">
            Join the list
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/shop" className="button-primary hidden lg:inline-flex">
            Shop the collection
          </Link>
          <CartButton />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
