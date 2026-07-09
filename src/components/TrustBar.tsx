import { Icon } from "./Icon";

const ITEMS = [
  { icon: "location-dot", label: "Every State & Every Country" },
  { icon: "store", label: "For All Mom & Pop Stores" },
  { icon: "bullhorn", label: "Affordable Advertising" },
  { icon: "circle-check", label: "Trusted by Local Communities" },
  { icon: "chart-line", label: "Grow Your Business Every Day" },
];

export function TrustBar() {
  return (
    <section className="border-y-2 border-gold/30 bg-paper-raised">
      <div className="container-shell grid grid-cols-2 gap-x-4 gap-y-6 py-8 sm:grid-cols-3 lg:grid-cols-5">
      {ITEMS.map((it) => (
        <div key={it.label} className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy">
            <Icon name={it.icon} className="text-gold" />
          </span>
          <span className="font-heading text-small font-semibold uppercase leading-snug tracking-wide text-navy">
            {it.label}
          </span>
        </div>
      ))}
      </div>
    </section>
  );
}
