import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { Icon } from "./Icon";
import { HeaderAuth } from "./HeaderAuth";
import { brand } from "@/lib/brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-gold/40 bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="container-shell flex h-16 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center" aria-label={brand.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logo} alt={brand.name} className="h-11 w-auto" />
        </Link>
        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>
        <nav className="ml-auto flex items-center gap-3">
          <Link
            href="/us"
            className="hidden font-heading font-semibold uppercase tracking-wide text-navy hover:text-barn sm:inline"
          >
            Browse
          </Link>
          <HeaderAuth />
          <Link href="/advertise" className="btn btn-gold !min-h-10 px-4 text-small">
            <Icon name="bullhorn" /> Advertise
          </Link>
        </nav>
      </div>
      <div className="container-shell pb-3 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
