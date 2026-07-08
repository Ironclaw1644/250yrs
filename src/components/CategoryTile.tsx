import Link from "next/link";
import { Icon } from "./Icon";
import type { Category } from "@/lib/brand";

export function CategoryTile({
  category,
  href,
  count,
}: {
  category: Category;
  href: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className="card group flex flex-col items-center gap-3 p-5 text-center"
    >
      <span className="pin-badge h-14 w-14 transition-transform duration-std group-hover:-translate-y-0.5">
        <Icon name={category.icon} className="text-xl" />
      </span>
      <span className="font-heading text-lg font-semibold leading-tight text-navy">
        {category.name}
      </span>
      <span className="text-small text-stone">
        {count != null ? `${count} ${count === 1 ? "place" : "places"}` : category.blurb}
      </span>
    </Link>
  );
}
