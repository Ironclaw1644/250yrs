import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { Icon } from "./Icon";
import { HeaderAuth } from "./HeaderAuth";
import { MobileNav } from "./MobileNav";
import { brand } from "@/lib/brand";

const NAV = [
  { href: "/us", label: "Find Businesses" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-gold/40 bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="container-shell relative flex h-16 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center" aria-label={brand.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logo} alt={brand.name} className="h-11 w-auto" />
        </Link>

        <nav className="ml-2 hidden items-center gap-5 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="font-heading text-small font-semibold uppercase tracking-wide text-navy hover:text-barn"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden max-w-md flex-1 md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <HeaderAuth />
          <Link href="/advertise" className="btn btn-gold !min-h-10 px-4 text-small">
            <Icon name="bullhorn" /> Advertise
          </Link>
          <MobileNav />
        </div>
      </div>
      <div className="container-shell pb-3 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
