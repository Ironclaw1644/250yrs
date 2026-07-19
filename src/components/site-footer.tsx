import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/6 bg-black/40">
      <div className="container-shell py-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0">
                <Image
                  src="/true-american-wear/logo.png"
                  alt="True American Wear logo"
                  fill
                  className="object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
                />
              </div>
              <div>
                <p className="font-display text-3xl text-brand-cream">
                  True American Wear
                </p>
                <p className="text-sm text-white/62">
                  Patriotic apparel built for the 250th year.
                </p>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-6 text-white/58">
              Celebrating America’s 250th anniversary with patriotic apparel.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm text-white/60">
            <div className="flex flex-col gap-2.5">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-gold/70">Shop</p>
              <Link href="/shop" className="transition hover:text-brand-cream">
                The collection
              </Link>
              <Link href="/cart" className="transition hover:text-brand-cream">
                Your cart
              </Link>
              <Link href="/#collection" className="transition hover:text-brand-cream">
                Featured pieces
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-gold/70">Company</p>
              <Link href="/#campaign" className="transition hover:text-brand-cream">
                The campaign
              </Link>
              <Link href="/#founders-intake" className="transition hover:text-brand-cream">
                Join the list
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 border-t border-white/6 pt-5 text-center sm:flex-row sm:justify-between">
          <p className="text-xs text-white/34">
            © {new Date().getFullYear()} True American Wear · Secure checkout by Stripe
          </p>
          <p className="text-xs text-white/34">
            Crafted by{" "}
            <a
              href="https://walkperro.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-white/60"
            >
              WalkPerro
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
