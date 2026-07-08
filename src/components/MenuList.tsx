import { centsToUSD } from "@/lib/format";
import type { MenuSectionWithItems } from "@/lib/queries";

export function MenuList({ sections }: { sections: MenuSectionWithItems[] }) {
  if (!sections.length) return null;
  return (
    <div className="space-y-8">
      {sections.map((s) => (
        <div key={s.id}>
          <h3 className="mb-3 font-heading text-h3 text-navy">{s.name}</h3>
          <ul className="space-y-3">
            {s.items.map((it) => (
              <li key={it.id}>
                <div className="leader-row">
                  <span className="font-semibold text-navy">{it.name}</span>
                  <span className="dots" aria-hidden />
                  <span className="tabular font-semibold text-barn">
                    {centsToUSD(it.price_cents, it.currency)}
                  </span>
                </div>
                {it.description && (
                  <p className="mt-0.5 max-w-prose text-small text-stone">
                    {it.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
