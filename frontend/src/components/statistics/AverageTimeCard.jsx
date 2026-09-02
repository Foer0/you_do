import { formatHoursMinutes } from "./calendarUtils";

function ClockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function TrendIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function ArrowUpRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

export default function AverageTimeCard({ avgSecs, deltaSecs, monthLabel, perLabel = "day" }) {
  const hasDelta = deltaSecs !== null && deltaSecs !== undefined;
  const isUp = hasDelta && deltaSecs >= 0;

  return (
    <section className="w-full rounded-3xl border border-ink/5 bg-cream-50 p-5 shadow-[0_4px_18px_rgba(73,55,44,0.08)] sm:p-6">
      <h2 className="text-lg font-semibold text-ink">Average time</h2>

      {/* Иконка — нейтральный акцент из основной (не "тепловой") палитры
          сайта: bg-heat-300 тут раньше давал слишком яркое амбер-пятно,
          спорившее с тёплым нейтральным фоном самой карточки. */}
      <div className="mt-4 flex flex-col items-center gap-2 py-2 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-400/20 text-sage-600">
          <ClockIcon className="h-6 w-6" />
        </span>
        <p className="text-3xl font-semibold text-ink">{formatHoursMinutes(avgSecs)}</p>
        <p className="text-sm text-ink/50">
          average per {perLabel} in {monthLabel}
        </p>
      </div>

      {/* Плашка тренда — цвет теперь несёт смысл (больше/меньше, а не
          "сколько часов" как на плитках календаря), поэтому берём его
          не из heat-шкалы, а прямо из sage/clay — тех же токенов, что
          у кнопок Start/Break. */}
      {hasDelta && (
        <div
          className={
            "mt-4 flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm text-ink " +
            (isUp ? "bg-sage-400/15" : "bg-clay-500/10")
          }
        >
          <span className="flex items-center gap-2">
            <TrendIcon className={"h-4 w-4 " + (isUp ? "text-sage-600" : "text-clay-600")} />
            {isUp ? "+" : "−"}
            {formatHoursMinutes(Math.abs(deltaSecs))} {isUp ? "more" : "less"} than previous
          </span>
          <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-ink/40" />
        </div>
      )}
    </section>
  );
}
