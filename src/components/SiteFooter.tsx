import Link from "next/link";
import { brand, CATEGORIES } from "@/lib/brand";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 bg-navy-deep text-mist">
      <div className="container-shell grid gap-10 py-14 md:grid-cols-4">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logo} alt={brand.name} className="h-14 w-auto" />
          <p className="mt-4 max-w-xs text-small">{brand.slogan}</p>
        </div>
        <div>
          <h4 className="eyebrow !text-gold">Explore</h4>
          <ul className="mt-3 space-y-2 text-small">
            <li><Link href="/us" className="hover:text-cloud">Browse the USA</Link></li>
            <li><Link href="/tv-spots" className="hover:text-cloud">TV Spots</Link></li>
            <li><Link href="/how-it-works" className="hover:text-cloud">How it works</Link></li>
            <li><Link href="/about" className="hover:text-cloud">About us</Link></li>
            <li><Link href="/contact" className="hover:text-cloud">Contact</Link></li>
            <li><Link href="/advertise" className="hover:text-cloud">Advertise your business</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="eyebrow !text-gold">Categories</h4>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-small">
            {CATEGORIES.slice(0, 8).map((c) => (
              <li key={c.slug}>
                <Link href={`/categories/${c.slug}`} className="hover:text-cloud">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="eyebrow !text-gold">Company</h4>
          <ul className="mt-3 space-y-2 text-small">
            <li><Link href="/legal" className="hover:text-cloud">Terms of Service</Link></li>
            <li><Link href="/legal" className="hover:text-cloud">Privacy Policy</Link></li>
            <li><Link href="/legal" className="hover:text-cloud">Cookie Policy</Link></li>
            <li><Link href="/legal" className="hover:text-cloud">Refunds & Cancellation</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-hairline">
        <div className="container-shell flex flex-col items-center justify-between gap-2 py-5 text-small sm:flex-row">
          <p>© {year} {brand.name}. All rights reserved.</p>
          <p>Made on Main Street, USA.</p>
        </div>
      </div>
    </footer>
  );
}
