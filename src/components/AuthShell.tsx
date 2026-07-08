import Link from "next/link";
import { brand } from "@/lib/brand";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="container-shell flex min-h-[72vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" aria-label={brand.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.logo} alt={brand.name} className="mx-auto h-14 w-auto" />
          </Link>
          <h1 className="mt-5 font-heading text-h1 text-navy">{title}</h1>
          {subtitle && <p className="mt-1 text-stone">{subtitle}</p>}
        </div>
        <div className="card p-6 sm:p-8">{children}</div>
        {footer && (
          <div className="mt-4 text-center text-small text-stone">{footer}</div>
        )}
      </div>
    </div>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block font-heading text-small font-semibold uppercase tracking-wide text-navy">
        {label}
      </span>
      <input
        {...props}
        className="h-12 w-full rounded-md border-[1.5px] border-navy/15 bg-linen px-3 text-navy focus:border-success focus:outline-none focus:ring-4 focus:ring-gold/25"
      />
    </label>
  );
}
