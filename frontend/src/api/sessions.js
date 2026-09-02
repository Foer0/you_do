import { api } from "./client";

// PUT возвращает { total_duration_secs, for_date } (DailyStatResponceAfterUpsert)
export function upsertTodaySession(totalDurationSecs) {
  return api.put("/sessions/today", { total_duration_secs: totalDurationSecs });
}

// GET возвращает { total_secs, session_count } (DailyStatResponse) —
// другие имена полей, чем у PUT, это не опечатка, разные схемы ответа.
export function getTodaySessionStats() {
  return api.get("/sessions/today");
}
