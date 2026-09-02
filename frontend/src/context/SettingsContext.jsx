import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as settingsApi from "../api/settings";
import { useAuth } from "./AuthContext";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await settingsApi.getSettings();
      setSettings(data);
      setError(null);
    } catch {
      setError("Failed to load settings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      // разлогинились — сбрасываем, чтобы следующий логин не увидел
      // на мгновение чужие старые настройки из памяти
      setSettings(null);
      setIsLoading(true);
    }
  }, [isAuthenticated, refresh]);

  // Локально применяем ответ PATCH сразу, без повторного GET —
  // сервер и так возвращает актуальный SettingResponse целиком.
  const updateSettings = useCallback(async (patch) => {
    const updated = await settingsApi.updateSettings(patch);
    setSettings(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({ settings, isLoading, error, refresh, updateSettings }),
    [settings, isLoading, error, refresh, updateSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
