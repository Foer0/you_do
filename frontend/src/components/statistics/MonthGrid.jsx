import { formatHoursMinutes } from "./calendarUtils";
import { buildHeatScale, MONTH_THRESHOLDS_HOURS } from "./heatScale";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ClockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

/** monthlyTotals: Map<monthIndex(0-11), number сек> */
export default function MonthGrid({ monthlyTotals }) {
  const heat = buildHeatScale(MONTH_THRESHOLDS_HOURS);

  return (
    <section className="w-full rounded-3xl border border-ink/5 bg-cream-50 p-5 shadow-[0_4px_18px_rgba(73,55,44,0.08)] sm:p-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {MONTH_NAMES.map((name, idx) => {
          const totalSecs = monthlyTotals.get(idx) ?? 0;
          return (
            <div
              key={name}
              className={
                "flex min-h-[110px] flex-col justify-center gap-1.5 px-7 py-5 transition-transform hover:scale-[1.02] " +
                heat.classFor(totalSecs) +
                " " +
                heat.textClassFor(totalSecs)
              }
              style={{ clipPath: "polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)" }}
            >
              <span className="text-2xl font-semibold leading-none">{String(idx + 1).padStart(2, "0")}</span>
              <span className="text-sm opacity-80">{name}</span>
              <span className="mt-1.5 flex items-center gap-1.5 text-xs opacity-70">
                <ClockIcon className="h-3 w-3 shrink-0" />
                {formatHoursMinutes(totalSecs)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink/10 pt-4 text-xs text-ink/60">
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
