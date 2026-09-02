const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * new Date("2025-01-01") парсит строку как UTC-полночь — в часовых
 * поясах западнее UTC (например, США) .getMonth()/.getDate() после
 * этого могут вернуть 31 декабря вместо 1 января. Конструируем дату
 * явно по локальным Y/M/D, не через парсинг строки.
 */
export function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Сетка недель для месячного календаря — понедельник первым днём,
 * с "хвостами" соседних месяцев для заполнения первой/последней недели
 * (ровно как в макете — приглушённые 28/29/30 и "1" по краям).
 */
export function buildMonthGrid(year, monthIndex) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // 0=Пн ... 6=Вс
  const gridStart = new Date(year, monthIndex, 1 - startOffset);

  const weeks = [];
  let cursor = new Date(gridStart);

  for (let week = 0; week < 6; week++) {
    const days = [];
    for (let day = 0; day < 7; day++) {
      days.push({
        date: new Date(cursor),
        key: toDateKey(cursor),
        day: cursor.getDate(),
        inCurrentMonth: cursor.getMonth() === monthIndex,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
    // не рисуем шестую неделю, если она целиком уже следующий месяц
    if (days[0].date.getMonth() !== monthIndex && week >= 4) break;
  }

  return { weeks, weekdayLabels: WEEKDAY_LABELS };
}

/**
 * Полный список недель квартала — считаем сами, календарной
 * арифметикой (как buildMonthGrid для дней), а не полагаемся на то,
 * сколько строк вернул бэкенд: GROUP BY по неделям физически не может
 * вернуть группу для недели, где вообще нет ни одной записи — значит,
 * недели без данных просто не попадут в ответ, и их нужно достроить
 * самим, с нулём, а не потерять.
 */
export function buildQuarterWeeks(quarterStart, quarterEnd) {
  const dow = (quarterStart.getDay() + 6) % 7; // 0=Пн ... 6=Вс
  const firstMonday = new Date(quarterStart);
  firstMonday.setDate(firstMonday.getDate() - dow);

  const weeks = [];
  const cursor = new Date(firstMonday);
  let index = 1;
  while (cursor <= quarterEnd) {
    const end = new Date(cursor);
    end.setDate(end.getDate() + 6);
    weeks.push({ index, start: new Date(cursor), end, key: toDateKey(cursor) });
    cursor.setDate(cursor.getDate() + 7);
    index += 1;
  }
  return weeks;
}

export function formatHoursMinutes(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0 && m === 0) return "0m";
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
