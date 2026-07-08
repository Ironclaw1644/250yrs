import { Icon } from "./Icon";

export function Stars({
  rating,
  count,
  showNumber = true,
}: {
  rating: number;
  count?: number;
  showNumber?: boolean;
}) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full)
          return <Icon key={i} name="star" className="text-gold text-sm" />;
        if (i === full && half)
          return (
            <Icon key={i} name="star-half-stroke" className="text-gold text-sm" />
          );
        return <Icon key={i} name="star" className="text-stone/30 text-sm" />;
      })}
      {showNumber && (
        <span className="ml-1 text-small text-stone">
          {rating.toFixed(1)}
          {count != null ? ` (${count})` : ""}
        </span>
      )}
    </span>
  );
}
