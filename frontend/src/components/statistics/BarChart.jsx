import { niceStep } from "./niceStep";
import { buildHeatScale } from "./heatScale";
import { formatHoursMinutes } from "./calendarUtils";

const CHART_W = 600;
const CHART_H = 240;
const PADDING = { top: 12, right: 12, bottom: 32, left: 46 };

const HEAT_COLOR_VAR = {
  "bg-heat-100": "var(--color-heat-100)",
  "bg-heat-200": "var(--color-heat-200)",
  "bg-heat-300": "var(--color-heat-300)",
  "bg-heat-400": "var(--color-heat-400)",
  "bg-heat-600": "var(--color-heat-600)",
};

// Часы для крупного масштаба, минуты — когда весь диапазон оси меньше
// часа (иначе округление до целых часов даёт "0h" на каждой отметке,
// даже если реальные величины вполне отличимы друг от друга).
function formatTick(totalSeconds, axisMax) {
  if (axisMax < 3600) return `${Math.round(totalSeconds / 60)}m`;
  return `${Math.round(totalSeconds / 3600)}h`;
}

/** data: [{ label: string, value: number (секунды) }], thresholdHours: number[] */
export default function BarChart({ data, thresholdHours }) {
  const values = data.map((d) => d.value);
  const max = Math.max(1, ...values);
  const step = niceStep(max / 4);
  const axisMax = Math.ceil(max / step) * step || step;

  const ticks = [];
  for (let v = 0; v <= axisMax; v += step) ticks.push(v);

  const heat = buildHeatScale(thresholdHours);

  const plotW = CHART_W - PADDING.left - PADDING.right;
  const plotH = CHART_H - PADDING.top - PADDING.bottom;
  const slot = plotW / (data.length || 1);
  const barWidth = slot * 0.62;

  const yFor = (v) => PADDING.top + plotH - (v / axisMax) * plotH;
  const heightFor = (v) => (v / axisMax) * plotH;

  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full" role="img" aria-label="Time per period bar chart">
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={PADDING.left}
            x2={CHART_W - PADDING.right}
            y1={yFor(t)}
            y2={yFor(t)}
            stroke="var(--color-ink)"
            strokeOpacity="0.08"
          />
          <text x={PADDING.left - 8} y={yFor(t) + 4.5} textAnchor="end" fontSize="12" fill="var(--color-ink)" fillOpacity="0.4">
            {formatTick(t, axisMax)}
          </text>
        </g>
      ))}

      {data.map((d, i) => {
        const x = PADDING.left + i * slot + (slot - barWidth) / 2;
        const h = heightFor(d.value);
        return (
          <g key={d.label}>
            <title>
              {d.label}: {formatHoursMinutes(d.value)}
            </title>
            <rect
              x={x}
              y={yFor(d.value)}
              width={barWidth}
              height={Math.max(h, d.value > 0 ? 2 : 0)}
              rx={3}
              fill={HEAT_COLOR_VAR[heat.classFor(d.value)]}
            />
            <text
              x={x + barWidth / 2}
              y={CHART_H - PADDING.bottom + 18}
              textAnchor="middle"
              fontSize="11"
              fill="var(--color-ink)"
              fillOpacity="0.5"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
