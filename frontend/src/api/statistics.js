import { api } from "./client";

/**
 * ПРЕДПОЛОЖЕНИЕ: query-параметр называется "date_" (с подчёркиванием) —
 * ровно как названа переменная в @router.get("/statistics", ...), а
 * Query() без alias в FastAPI берёт имя параметра как есть. Если
 * добавишь Query(alias="date") — поменяй здесь на "date".
 *
 * granularity: "day" | "week" | "month"
 * date: любая дата внутри интересующего периода (YYYY-MM-DD) —
 * для "day" бэкенд берёт весь месяц, для "week" — весь квартал,
 * для "month" — весь год, содержащие эту дату.
 *
 * Ответ: [{ period: "YYYY-MM-DD", time_secs: number }, ...]
 */
export function getStatistics(granularity, date) {
  return api.get(`/statistics?granularity=${granularity}&date_=${date}`);
}

/**
 * Задачи за весь месяц, содержащий date — используется только для
 * вкладки Day: тянем разом на весь месяц, а не по клику на каждый
 * день, и группируем по created_at на фронте (см. groupTasksByDay).
 */
export function getStatisticsTasks(date) {
  return api.get(`/statistics/tasks?granularity=day&date_=${date}`);
}

export function groupTasksByDay(tasks) {
  const map = new Map();
  for (const task of tasks) {
    const key = task.created_at;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(task);
  }
  return map;
}
