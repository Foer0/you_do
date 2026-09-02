import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSettings } from "./SettingsContext";
import { resolveAssetUrl } from "../api/client";

const TimerContext = createContext(null);

/**
 * Почему это глобальный контекст, а не локальный хук внутри HomePage:
 *
 * React Router размонтирует HomePage при переходе на другую страницу —
 * любое состояние, которое жило бы внутри неё (как раньше useTimer),
 * пропадало бы при навигации. Вынося его сюда, на верхний уровень
 * (монтируется один раз, при логине, и живёт, пока открыта вкладка),
 * мы получаем "фоновую" работу бесплатно — это тот же JS-процесс,
 * setInterval тикает независимо от того, какой роут сейчас отрисован.
 *
 * Это НЕ переживает полную перезагрузку страницы/закрытие вкладки —
 * для этого понадобилось бы сохранять состояние в localStorage и
 * восстанавливать прошедшее время по разнице реальных таймстампов,
 * это отдельная, более объёмная задача.
 */
export function TimerProvider({ children }) {
  const { settings } = useSettings();

  const [phase, setPhase] = useState("work"); // 'work' | 'break'
  const [secondsLeft, setSecondsLeft] = useState(null); // null — ещё не настроен
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);
  const [isConfigured, setIsConfigured] = useState(false);

  // Длительности "замораживаются" один раз, при первой настройке —
  // если пользователь поменяет Session/Break на странице настроек
  // прямо во время идущего отсчёта, это не должно дёргать уже
  // запущенный таймер на лету (это касалось бы и старой,
  // локальной версии до переноса сюда).
  const configRef = useRef({});
  const onWorkSessionEndRef = useRef(null);

  useEffect(() => {
    if (!settings || isConfigured) return;
    configRef.current = {
      workSeconds: settings.session_secs,
      breakSeconds: settings.break_secs,
      longBreakSeconds: settings.long_break_secs,
      longBreakTriggerSession: settings.long_break_trigger_session,
    };
    setSecondsLeft(settings.session_secs);
    setIsConfigured(true);
  }, [settings, isConfigured]);

  // HomePage регистрирует здесь свой обработчик (он обновляет
  // totalSecondsToday и шлёт PUT /sessions/today) — регистрируется
  // заново при каждом монтировании HomePage, чтобы всегда использовался
  // колбэк актуального инстанса, а не "протухший" от предыдущего.
  const registerWorkSessionEndHandler = useCallback((handler) => {
    onWorkSessionEndRef.current = handler;
  }, []);

  useEffect(() => {
    if (!isRunning || !isConfigured) return;

    const id = setInterval(() => {
      const { workSeconds } = configRef.current;

      if (phase === "break") {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setPhase("work");
            setIsRunning(false);
            setIsLongBreak(false);
            return workSeconds;
          }
          return prev - 1;
        });
        return;
      }

      if (!isOvertime) {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsOvertime(true);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setOvertimeSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning, isOvertime, phase, isConfigured]);

  const toggle = useCallback(() => setIsRunning((r) => !r), []);

  // Break/Skip — смысл зависит от текущей фазы. В фазе work заодно
  // решает, обычный это перерыв или длинный: каждая N-я завершённая
  // сессия (N = long_break_trigger_session) уходит в длинный перерыв
  // вместо обычного — только если оба поля (секунды и интервал) заданы.
  const handleBreakButton = useCallback(() => {
    const { workSeconds, breakSeconds, longBreakSeconds, longBreakTriggerSession } = configRef.current;

    if (phase === "work") {
      const elapsedSeconds = isOvertime ? workSeconds + overtimeSeconds : workSeconds - secondsLeft;
      if (elapsedSeconds > 0) onWorkSessionEndRef.current?.(elapsedSeconds);

      const nextCount = completedSessionsCount + 1;
      const shouldBeLong =
        longBreakSeconds != null &&
        longBreakTriggerSession != null &&
        longBreakTriggerSession > 0 &&
        nextCount % longBreakTriggerSession === 0;

      setCompletedSessionsCount(nextCount);
      setIsLongBreak(shouldBeLong);
      setIsOvertime(false);
      setOvertimeSeconds(0);
      setPhase("break");
      setSecondsLeft(shouldBeLong ? longBreakSeconds : breakSeconds);
      setIsRunning(true);
    } else {
      setPhase("work");
      setSecondsLeft(workSeconds);
      setIsRunning(false);
      setIsLongBreak(false);
    }
  }, [phase, isOvertime, overtimeSeconds, secondsLeft, completedSessionsCount]);

  // Звук по истечении рабочего отсчёта — живёт здесь же, а не в
  // компоненте страницы: тогда он сработает, даже если в этот момент
  // пользователь не на главной странице (ровно то же обоснование, что
  // и для самого таймера — состояние не должно зависеть от того, что
  // сейчас отрисовано).
  const wasOvertimeRef = useRef(false);
  useEffect(() => {
    const justEntered = isOvertime && !wasOvertimeRef.current;
    wasOvertimeRef.current = isOvertime;
    if (!justEntered) return;

    const url = settings?.sound_url ? resolveAssetUrl(settings.sound_url) : null;
    if (!url) return;

    const audio = new Audio(url);
    audio.play().catch(() => {});
    const timeoutId = setTimeout(
      () => audio.pause(),
      Math.max(0, settings?.sound_duration_secs ?? 0) * 1000
    );

    return () => {
      clearTimeout(timeoutId);
      audio.pause();
    };
  }, [isOvertime, settings]);

  const value = {
    isConfigured,
    phase,
    secondsLeft,
    overtimeSeconds,
    isOvertime,
    isRunning,
    isLongBreak,
    toggle,
    handleBreakButton,
    registerWorkSessionEndHandler,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useGlobalTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useGlobalTimer must be used within TimerProvider");
  return ctx;
}
