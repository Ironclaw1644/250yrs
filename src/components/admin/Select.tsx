"use client";

import { Icon } from "@/components/Icon";

/** Styled native select for the dark admin (chevron overlay, gold focus). */
export function Select({
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={`relative inline-block ${className}`}>
      <select
        {...props}
        className="h-9 w-full appearance-none rounded-md border border-hairline bg-slate-2 pl-3 pr-8 text-small font-semibold text-cloud transition-colors focus:border-gold focus:outline-none disabled:opacity-50"
      />
      <Icon
        name="chevron-right"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-[10px] text-mist"
      />
    </span>
  );
}
