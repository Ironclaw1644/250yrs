import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { Icon } from "./Icon";
import { HeaderAuth } from "./HeaderAuth";
import { MobileNav } from "./MobileNav";
import { brand } from "@/lib/brand";

const LEFT_NAV = [
  { href: "/us", label: "Find Businesses" },
  { href: "/how-it-works", label: "How It Works" },
];
const RIGHT_NAV = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-gold/40 bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="container-shell relative grid h-[5.5rem] grid-cols-[1fr_auto_1fr] items-center gap-3 sm:h-24">
        {/* Left: CTA where the logo used to live (+ desktop links) */}
        <div className="flex items-center gap-5">
          <Link
            href="/advertise"
            className="btn btn-gold !min-h-10 px-3 text-small sm:px-4"
          >
            <Icon name="bullhorn" />
            <span className="hidden min-[400px]:inline">Advertise</span>
          </Link>
          {LEFT_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="hidden whitespace-nowrap font-sans text-small font-bold text-navy hover:text-barn lg:inline"
            >
              {n.label}
            </Link>
          ))}
        </div>

        {/* Center: the logo, big and proud (biggest on mobile per client) */}
        <Link
          href="/"
          className="justify-self-center transition-transform duration-std ease-warm hover:scale-[1.03]"
          aria-label={brand.name}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logo} alt={brand.name} className="h-20 w-auto sm:h-[5.25rem]" />
        </Link>

        {/* Right: desktop links + auth + menu */}
        <div className="flex items-center justify-end gap-5">
          {RIGHT_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="hidden whitespace-nowrap font-sans text-small font-bold text-navy hover:text-barn lg:inline"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/search"
            aria-label="Search"
            className="hidden text-navy hover:text-barn sm:inline"
          >
            <Icon name="magnifying-glass" className="text-lg" />
          </Link>
          <HeaderAuth />
          <MobileNav />
        </div>
      </div>

      {/* Mobile search stays a quick thumb-reach away */}
      <div className="container-shell pb-3 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
