const HEAT_CLASSES = ["bg-heat-100", "bg-heat-200", "bg-heat-300", "bg-heat-400", "bg-heat-600"];

// Фиксированные пороги (в часах) под каждую вкладку — заданы явно,
// не вычисляются из данных, потому что масштаб принципиально разный
// между сутками/неделей/месяцем и "относительная" шкала (% от
// максимума в текущей выборке) давала бы несравнимые между собой
// цвета от месяца к месяцу.
export const DAY_THRESHOLDS_HOURS = [0, 4, 7, 10, 12];
export const WEEK_THRESHOLDS_HOURS = [0, 28, 49, 70, 84];
export const MONTH_THRESHOLDS_HOURS = [0, 120, 210, 300, 360];

/**
 * Строит шкалу из 5 уровней по явно заданным порогам (в часах).
 */
export function buildHeatScale(thresholdHours) {
  const thresholds = thresholdHours.map((h) => h * 3600);

  const classFor = (value) => {
    let idx = 0;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (value >= thresholds[i]) {
        idx = i;
        break;
      }
    }
    return HEAT_CLASSES[idx];
  };

  const textClassFor = (value) => (classFor(value) === "bg-heat-600" ? "text-cream-50" : "text-ink");

  const legend = thresholdHours.map((h, i) => ({
    label: `${h}+`,
    className: HEAT_CLASSES[i],
  }));

  return { classFor, textClassFor, legend };
}
