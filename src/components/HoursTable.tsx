import { DAY_NAMES, formatTime } from "@/lib/format";
import type { BusinessHour } from "@/lib/db-types";

export function HoursTable({ hours }: { hours: BusinessHour[] }) {
  const byDay: Record<number, BusinessHour[]> = {};
  for (const h of hours) (byDay[h.day_of_week] ??= []).push(h);
  const today = new Date().getDay();
  const order = [1, 2, 3, 4, 5, 6, 0];

  return (
    <table className="w-full text-small">
      <tbody>
        {order.map((d) => {
          const rows = byDay[d] ?? [];
          const open = rows.filter((r) => !r.is_closed && r.open_time);
          return (
            <tr
              key={d}
              className={
                d === today
                  ? "font-semibold text-navy"
                  : "text-char/80"
              }
            >
              <td className="py-1.5 pr-4">{DAY_NAMES[d]}</td>
              <td className="py-1.5 text-right tabular">
                {open.length === 0 ? (
                  <span className="text-stone">Closed</span>
                ) : (
                  open
                    .map(
                      (r) =>
                        `${formatTime(r.open_time)} – ${formatTime(r.close_time)}`,
                    )
                    .join(", ")
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
