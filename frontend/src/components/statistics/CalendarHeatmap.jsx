import { buildMonthGrid, formatHoursMinutes } from "./calendarUtils";
import { buildHeatScale, DAY_THRESHOLDS_HOURS } from "./heatScale";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ChevronIcon({ direction, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points={direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
    </svg>
  );
}

export default function CalendarHeatmap({
  year,
  monthIndex,
  dailyTotals,
  selectedKey,
  onSelectDay,
  onNavigate,
}) {
  const { weeks, weekdayLabels } = buildMonthGrid(year, monthIndex);
  const heat = buildHeatScale(DAY_THRESHOLDS_HOURS);

  return (
    <section className="w-full rounded-3xl border border-ink/5 bg-cream-50 p-5 shadow-[0_4px_18px_rgba(73,55,44,0.08)] sm:p-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate(-1)}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream-100 text-ink/60 hover:text-ink"
        >
          <ChevronIcon direction="left" className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-ink">
          {MONTH_NAMES[monthIndex]} {year}
        </h2>

        <button
          type="button"
          onClick={() => onNavigate(1)}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream-100 text-ink/60 hover:text-ink"
        >
          <ChevronIcon direction="right" className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-ink/50 sm:gap-2">
        {weekdayLabels.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-1.5 sm:gap-2">
        {weeks.flatMap((week) =>
          week.map((cell) => {
            const totalSecs = dailyTotals.get(cell.key) ?? 0;
            const isSelected = cell.key === selectedKey;
            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => cell.inCurrentMonth && onSelectDay(cell.key)}
                disabled={!cell.inCurrentMonth}
                className={
                  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-xs transition-transform disabled:cursor-default sm:text-sm " +
                  (cell.inCurrentMonth
                    ? heat.classFor(totalSecs) + " " + heat.textClassFor(totalSecs) + " hover:scale-[1.03]"
                    : "bg-transparent text-ink/25") +
                  (isSelected ? " ring-2 ring-heat-600 ring-offset-1 ring-offset-cream-50" : "")
                }
              >
                <span className="font-semibold">{cell.day}</span>
                {cell.inCurrentMonth && (
                  <span className="text-[0.65em] opacity-80">
                    {formatHoursMinutes(totalSecs)}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink/10 pt-4 text-xs text-ink/60">
        {heat.legend.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={"h-3 w-3 rounded-sm border border-ink/10 " + item.className} />
            {item.label}
          </span>
        ))}
        <span className="ml-auto text-ink/40">
          Month: {MONTH_NAMES[monthIndex]} {year}
        </span>
      </div>
    </section>
  );
}
