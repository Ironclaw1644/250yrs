import Link from "next/link";
import { Icon } from "./Icon";

export function EmptyState({
  icon = "store",
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  icon?: string;
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-14 text-center">
      <span className="pin-badge h-16 w-16">
        <Icon name={icon} className="text-2xl" />
      </span>
      <h3 className="font-heading text-h3 text-navy">{title}</h3>
      <p className="max-w-md text-stone">{body}</p>
      {ctaHref && ctaLabel && (
        <Link href={ctaHref} className="btn btn-gold">
          <Icon name="bullhorn" /> {ctaLabel}
        </Link>
      )}
    </div>
  );
}
