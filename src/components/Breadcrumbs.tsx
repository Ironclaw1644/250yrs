import Link from "next/link";
import { Icon } from "./Icon";

export type Crumb = { name: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <ol className="flex flex-wrap items-center gap-y-1 text-small">
        {items.map((it, i) => (
          <li key={i} className="flex items-center">
            {i > 0 && <Icon name="chevron-right" className="sep text-xs" />}
            {it.href ? (
              <Link href={it.href} className="hover:underline">
                {it.name}
              </Link>
            ) : (
              <span className="text-stone" aria-current="page">
                {it.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
