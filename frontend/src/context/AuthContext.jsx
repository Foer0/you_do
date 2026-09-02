import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth";
import { getBrowserTimezone } from "../api/auth";
import { setAccessToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  // Пока не попробовали /auth/refresh хотя бы раз — не знаем, залогинен
  // человек или нет; роуты (guards.jsx) должны дождаться этого, а не
  // мгновенно решить "не залогинен" и мигнуть лендингом.
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    authApi
      .refresh()
      .then((data) => {
        if (cancelled) return;
        setAccessToken(data.access_token);
        setToken(data.access_token);
      })
      .catch(() => {
        // нет валидной refresh-куки (первый визит, истекла, её отозвали)
        // — это ожидаемое "не залогинен", не ошибка
        if (cancelled) return;
        setAccessToken(null);
        setToken(null);
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password, timezone: getBrowserTimezone() });
    setAccessToken(data.access_token);
    setToken(data.access_token);
  }, []);

  const register = useCallback(async (email, password) => {
    const data = await authApi.register({ email, password, timezone: getBrowserTimezone() });
    setAccessToken(data.access_token);
    setToken(data.access_token);
  }, []);

  // idToken — это JWT-credential, который отдаёт Google Identity Services
  // после успешного выбора аккаунта на клиенте; бэкенд сам его проверяет
  // и заводит/находит пользователя, timezone тут передавать не нужно —
  // роут "/auth/google" её не принимает.
  const loginWithGoogle = useCallback(async (idToken) => {
    const data = await authApi.googleAuth({ idToken });
    setAccessToken(data.access_token);
    setToken(data.access_token);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort — даже если "/auth/logout" ещё не готов на бэке
      // (пока 404) или запрос не прошёл, разлогиниваем локально в любом
      // случае: локальный access-токен всё равно забыт.
    }
    setAccessToken(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      isInitializing,
      login,
      register,
      loginWithGoogle,
      logout,
    }),
    [token, isInitializing, login, register, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
