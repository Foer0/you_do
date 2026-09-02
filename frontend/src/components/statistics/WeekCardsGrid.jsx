import { formatHoursMinutes } from "./calendarUtils";
import { buildHeatScale, WEEK_THRESHOLDS_HOURS } from "./heatScale";

function formatRange(start, end) {
  const opts = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

/** weeks: [{ index, start: Date, end: Date, totalSecs }] */
export default function WeekCardsGrid({ weeks }) {
  const heat = buildHeatScale(WEEK_THRESHOLDS_HOURS);

  return (
    <section className="w-full rounded-3xl border border-ink/5 bg-cream-50 p-5 shadow-[0_4px_18px_rgba(73,55,44,0.08)] sm:p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {weeks.map((w) => (
          <div
            key={w.index}
            className={
              "flex flex-col gap-2 rounded-2xl px-4 py-3.5 " +
              heat.classFor(w.totalSecs) +
              " " +
              heat.textClassFor(w.totalSecs)
            }
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">Week {w.index}</span>
              <span className="text-sm font-medium">{formatHoursMinutes(w.totalSecs)}</span>
            </div>
            <span className="text-xs opacity-70">{formatRange(w.start, w.end)}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink/10 pt-4 text-xs text-ink/60">
        {heat.legend.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={"h-3 w-3 rounded-sm border border-ink/10 " + item.className} />
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}
