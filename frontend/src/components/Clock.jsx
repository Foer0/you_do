import clockImage from "../assets/clock.webp";

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function Clock({
  secondsLeft,
  isOvertime,
  overtimeSeconds,
  sessions,
  totalSecondsToday,
  isBreak = false,
  isLongBreak = false,
}) {
  return (
    <div
      className="relative mx-auto w-full max-w-md"
      style={{ containerType: "inline-size" }}
    >
      {/* мягкая рассеянная тень под часами — смещена влево, а не строго
          вниз, иначе она читается как "объект парит" */}
      <div
        className="absolute left-[32%] top-[80%] h-[12%] w-[62%] -translate-x-1/2 rounded-full bg-black/15 blur-2xl"
        aria-hidden="true"
      />
      {/* + плотная контактная тень прямо под корпусом — короче и темнее,
          даёт ощущение веса, как в предметной съёмке на референсе */}
      <div
        className="absolute left-[36%] top-[85%] h-[5%] w-[34%] -translate-x-1/2 rounded-full bg-black/25 blur-md"
        aria-hidden="true"
      />

      <img
        src={clockImage}
        alt=""
        className="relative w-full select-none"
        draggable={false}
      />

      {/* Оверлей поверх экрана часов — проценты сняты напрямую с картинки clock.webp.
          Шрифт в cqw (% от ширины этого же контейнера, а не унаследованный em) —
          так он всегда пропорционален реальному размеру часов, в каком бы блоке
          они ни рендерились (дашборд, узкая витрина на странице входа и т.д). */}
      <div
        className="absolute px-[4%] py-[3%] font-mono text-ink"
        style={{
          left: "17.4%",
          top: "33.7%",
          width: "64.8%",
          height: "33%",
        }}
      >
        <div className="relative h-full w-full">
          {isBreak && (
            <span
              className="absolute right-0 top-0 font-semibold uppercase tracking-wide text-sage-600"
              style={{ fontSize: "clamp(7px, 2.6cqw, 13px)" }}
            >
              {isLongBreak ? "Long break" : "Break"}
            </span>
          )}

          <div className="flex h-full items-center justify-center">
            <span
              className={
                "font-semibold tabular-nums leading-none transition-colors " +
                (isOvertime ? "text-danger-500" : "text-ink")
              }
              style={{ fontSize: "clamp(18px, 11cqw, 46px)" }}
            >
              {isOvertime ? `+${formatTime(overtimeSeconds)}` : formatTime(secondsLeft)}
            </span>
          </div>

          <div
            className="absolute bottom-0 left-0 flex flex-col gap-0.5 leading-tight opacity-80"
            style={{ fontSize: "clamp(7px, 2.6cqw, 13px)" }}
          >
            <span>Sessions: {sessions}</span>
            <span>Total: {formatTime(totalSecondsToday)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
