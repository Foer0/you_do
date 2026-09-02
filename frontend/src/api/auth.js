import { api } from "./client";

export function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function register({ email, password, timezone }) {
  // auth: false — на регистрации токена ещё нет, подставлять нечего
  return api.post("/auth/register", { email, password, timezone }, { auth: false });
}

export function login({ email, password, timezone }) {
  return api.post("/auth/login", { email, password, timezone }, { auth: false });
}

// auth: false — идентификатор от Google уже сам по себе доказательство
// личности, Authorization-заголовок тут не нужен (и его ещё нет).
// timezone шлём только при первом входе (создании пользователя) — бэкенд
// её игнорирует для уже существующего Google-аккаунта, но дешевле
// прислать всегда, чем городить отдельную ветку на фронте.
export function googleAuth({ idToken }) {
  return api.post(
    "/auth/google",
    { id_token: idToken, timezone: getBrowserTimezone() },
    { auth: false }
  );
}

// auth: false — эти запросы не несут Authorization-заголовок вообще,
// они опираются только на httpOnly refresh-куку.
export function refresh() {
  return api.post("/auth/refresh", undefined, { auth: false });
}

// TODO: бэкенд-роут ещё не реализован ("/auth/logout" на очереди) —
// логика в AuthContext уже готова его дождаться, вызов best-effort
// (даже если сейчас 404 — локальный выход всё равно произойдёт).
export function logout() {
  return api.post("/auth/logout", undefined, { auth: false });
}
