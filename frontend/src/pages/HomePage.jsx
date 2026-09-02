import { useCallback, useEffect, useState } from "react";
import Clock from "../components/Clock";
import TimerControls from "../components/TimerControls";
import TaskList from "../components/TaskList";
import { useGlobalTimer } from "../context/TimerContext";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { ApiError } from "../api/client";
import * as tasksApi from "../api/tasks";
import * as sessionsApi from "../api/sessions";

export default function HomePage() {
  const { logout } = useAuth();
  const { settings, isLoading: settingsLoading } = useSettings();
  const { isConfigured: timerConfigured } = useGlobalTimer();

  const [tasks, setTasks] = useState([]);
  const [totalSecondsToday, setTotalSecondsToday] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [tasksData, statsData] = await Promise.all([
          tasksApi.getTasks(),
          sessionsApi.getTodaySessionStats(),
        ]);
        if (cancelled) return;
        setTasks(tasksData);
        setTotalSecondsToday(statsData.total_secs);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        setError("Failed to load data. Make sure the backend is running.");
      } finally {
        if (!cancelled) setIsDataLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const handleWorkSessionEnd = useCallback(async (elapsedSeconds) => {
    try {
      const data = await sessionsApi.upsertTodaySession(elapsedSeconds);
      // total_duration_secs — уже актуальная сумма с сервера, не прибавляем
      // локально (важно на случай нескольких открытых вкладок).
      setTotalSecondsToday(data.total_duration_secs);
    } catch {
      setError("Failed to save the session — please try again.");
    }
  }, []);

  const handleToggleTask = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === "done" ? "in_progress" : "done";

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await tasksApi.updateTask(taskId, { status: newStatus });
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      );
      setError("Failed to update the task.");
    }
  };

  const handleEditTask = async (taskId, content) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const previousContent = task.content;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, content } : t))
    );

    try {
      await tasksApi.updateTask(taskId, { content });
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, content: previousContent } : t))
      );
      setError("Failed to save changes.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    const previousTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await tasksApi.deleteTask(taskId);
    } catch {
      setTasks(previousTasks);
      setError("Failed to delete the task.");
    }
  };

  const handleAddTask = async (content) => {
    const tempId = `temp-${Date.now()}`;
    setTasks((prev) => [...prev, { id: tempId, content, status: "in_progress" }]);

    try {
      const created = await tasksApi.createTask({ content, status: "in_progress" });
      setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)));
    } catch {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      setError("Failed to add the task.");
    }
  };

  // timerConfigured дожидается не только settingsLoading (сами данные
  // настроек), но и того, что глобальный таймер успел на их основе
  // выставить себе стартовую длительность — обычно это происходит
  // почти сразу же следом, но без этой проверки был бы редкий шанс
  // отрисовать Clock с ещё не готовым secondsLeft.
  const isLoading = isDataLoading || settingsLoading || !timerConfigured;

  return (
    <div className="pt-2">
      {error && (
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-danger-500/10 px-4 py-2.5 text-sm text-danger-600">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss message"
              className="shrink-0 text-danger-600/60 hover:text-danger-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        // те же ширины колонок (спейсер / центр / Tasks), что и в
        // HomeContent ниже, чтобы скелет не "прыгал" в момент подгрузки
        // реального контента.
        <div className="mt-6 flex flex-col gap-10 lg:mt-10 lg:flex-row lg:items-start lg:gap-10">
          <div className="hidden lg:block lg:w-[300px] xl:w-[340px] lg:shrink-0" aria-hidden="true" />
          <div className="mx-auto flex w-full max-w-xs flex-1 flex-col items-center gap-6 sm:max-w-sm lg:max-w-[460px]">
            <div className="aspect-[3/2] w-full animate-pulse rounded-3xl bg-cream-200" />
          </div>
          <div className="mx-auto w-full max-w-lg lg:mx-0 lg:w-[300px] lg:shrink-0 xl:w-[340px]">
            <div className="h-48 w-full animate-pulse rounded-3xl bg-cream-200" />
          </div>
        </div>
      ) : !settings ? (
        <p className="mt-10 rounded-xl bg-danger-500/10 px-4 py-2.5 text-sm text-danger-600">
          Failed to load your settings. Try refreshing the page.
        </p>
      ) : (
        <HomeContent
          tasks={tasks}
          totalSecondsToday={totalSecondsToday}
          sessionSeconds={settings.session_secs}
          onWorkSessionEnd={handleWorkSessionEnd}
          onToggleTask={handleToggleTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onAddTask={handleAddTask}
        />
      )}
    </div>
  );
}

function HomeContent({
  tasks,
  totalSecondsToday,
  sessionSeconds,
  onWorkSessionEnd,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onAddTask,
}) {
  const {
    phase,
    secondsLeft,
    overtimeSeconds,
    isOvertime,
    isRunning,
    isLongBreak,
    toggle,
    handleBreakButton,
    registerWorkSessionEndHandler,
  } = useGlobalTimer();

  // Перерегистрируем при каждом монтировании HomePage — обработчик
  // замыкает setTotalSecondsToday/setError ИМЕННО этого инстанса,
  // а не какого-то предыдущего, уже размонтированного при уходе
  // на другую страницу.
  useEffect(() => {
    registerWorkSessionEndHandler(onWorkSessionEnd);
  }, [onWorkSessionEnd, registerWorkSessionEndHandler]);

  const sessions = sessionSeconds > 0 ? Math.floor(totalSecondsToday / sessionSeconds) : 0;

  return (
    // Часы — настоящий центр страницы (как на референсе), а не центр
    // своей узкой колонки в сетке. Добиваемся этого невидимым
    // "спейсером" слева той же ширины, что и колонка Tasks справа:
    // тогда центральная колонка с часами становится центром всей
    // строки целиком, а Tasks остаётся фиксированной по ширине
    // плавающей карточкой, а не растягивается вслед за часами.
    <div className="mt-6 flex flex-col gap-10 lg:mt-10 lg:flex-row lg:items-start lg:gap-10">
      <div className="hidden lg:block lg:w-[300px] xl:w-[340px] lg:shrink-0" aria-hidden="true" />

      <div className="mx-auto flex w-full min-w-0 max-w-xs flex-1 flex-col items-center gap-7 sm:max-w-sm lg:max-w-[460px]">
        <Clock
          secondsLeft={secondsLeft}
          isOvertime={isOvertime}
          overtimeSeconds={overtimeSeconds}
          sessions={sessions}
          totalSecondsToday={totalSecondsToday}
          isBreak={phase === "break"}
          isLongBreak={isLongBreak}
        />
        <TimerControls
          isRunning={isRunning}
          isBreak={phase === "break"}
          onToggle={toggle}
          onBreak={handleBreakButton}
        />
      </div>

      <div className="mx-auto w-full max-w-lg lg:mx-0 lg:w-[300px] lg:shrink-0 xl:w-[340px]">
        <TaskList
          tasks={tasks}
          onToggle={onToggleTask}
          onEdit={onEditTask}
          onDelete={onDeleteTask}
          onAdd={onAddTask}
        />
      </div>
    </div>
  );
}
