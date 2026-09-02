const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Access-токен теперь живёт только в памяти (переменная модуля), не в
 * localStorage/sessionStorage — он короткоживущий, и переживать
 * перезагрузку ему не нужно: пока жив httpOnly refresh_token (кука,
 * недоступная JS вообще, ей управляет только сервер), при загрузке
 * приложения можно молча перевыпустить новый через /auth/refresh.
 */
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

/**
 * ApiError несёт HTTP-статус — это нужно, чтобы вызывающий код мог
 * различать разные случаи (401 -> разлогинить, 409 -> "email занят",
 * 422 -> показать ошибку валидации) вместо одного общего каскада try/catch.
 */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Несколько параллельных запросов, упавших с 401 одновременно, не
// должны запускать несколько одновременных /auth/refresh — все ждут
// один и тот же промис.
let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", // без этого httpOnly-кука не уйдёт с запросом
    })
      .then(async (response) => {
        if (!response.ok) throw new ApiError("Session expired", response.status);
        const data = await response.json();
        accessToken = data.access_token;
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request(path, { method = "GET", body, auth = true, _retried = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include", // нужно на ВСЕХ запросах — /auth/refresh может
    // молча перевыпустить refresh-куку и на обычных защищённых эндпоинтах
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content — тела нет вообще, парсить нечего
  if (response.status === 204) return null;

  // 401 на защищённом запросе — пробуем один раз обновить access-токен
  // и повторить исходный запрос; если это уже был повтор (_retried),
  // не зацикливаемся — значит, и refresh_token тоже не годится.
  if (response.status === 401 && auth && !_retried) {
    try {
      await refreshAccessToken();
    } catch {
      accessToken = null;
      throw new ApiError("Session expired", 401);
    }
    return request(path, { method, body, auth, _retried: true });
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // FastAPI кладёт текст ошибки в поле "detail"
    const message = data?.detail || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data;
}

export const api = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body, opts = {}) => request(path, { method: "POST", body, ...opts }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};

/**
 * Бэкенд отдаёт статические ассеты (звуки и т.п.) относительными путями
 * вида "/static/sounds/bell.mp3" — это относительно ЕГО собственного
 * origin, не фронтенда. Если просто подставить такой путь в <audio src>,
 * браузер резолвит его относительно localhost:5173 (фронтенд), где
 * файла нет. Нужно явно приклеить адрес бэкенда.
 */
export function resolveAssetUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//.test(path)) return path; // уже абсолютный — не трогаем
  return `${BASE_URL}${path}`;
}
