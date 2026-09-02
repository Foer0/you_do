import { api } from "./client";

export function getTasks(forDate) {
  // без ?for_date — бэкенд сам подставит "сегодня" по локали пользователя
  return api.get(forDate ? `/tasks?for_date=${forDate}` : "/tasks");
}

export function createTask({ content, status = "in_progress", created_at }) {
  // created_at не передаём для главной страницы (там всегда "сегодня",
  // бэкенд сам подставит) — только когда явно нужна конкретная дата,
  // как на странице статистики.
  return api.post("/tasks", created_at ? { content, status, created_at } : { content, status });
}

export function updateTask(taskId, patch) {
  return api.patch(`/tasks/${taskId}`, patch);
}

export function deleteTask(taskId) {
  return api.delete(`/tasks/${taskId}`);
}
