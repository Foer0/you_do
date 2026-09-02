import { useEffect, useMemo, useState } from "react";
import GranularityTabs from "../components/statistics/GranularityTabs";
import CalendarHeatmap from "../components/statistics/CalendarHeatmap";
import MonthGrid from "../components/statistics/MonthGrid";
import WeekCardsGrid from "../components/statistics/WeekCardsGrid";
import BarChart from "../components/statistics/BarChart";
import TaskList from "../components/TaskList";
import AverageTimeCard from "../components/statistics/AverageTimeCard";
import { parseLocalDate, buildQuarterWeeks } from "../components/statistics/calendarUtils";
import { WEEK_THRESHOLDS_HOURS, MONTH_THRESHOLDS_HOURS } from "../components/statistics/heatScale";
import * as statsApi from "../api/statistics";
import * as tasksApi from "../api/tasks";
import { ApiError } from "../api/client";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayKey() {
  return toDateKey(new Date());
}

function getQuarterInfo(date) {
  const quarterIndex = Math.floor(date.getMonth() / 3); // 0-3
  const startMonth = quarterIndex * 3;
  const start = new Date(date.getFullYear(), startMonth, 1);
  const end = new Date(date.getFullYear(), startMonth + 3, 0); // последний день квартала
  return { start, end, label: `Q${quarterIndex + 1} ${date.getFullYear()}` };
}

function formatShortDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDayLabel(dateKey) {
  const [y, m, d] = dateKey.split("-");
  return `${d}/${m}/${y}`;
}

export default function StatisticsPage() {
  const [granularity, setGranularity] = useState("day");
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Day ---
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [selectedKey, setSelectedKey] = useState(todayKey());
  const [dailyTotals, setDailyTotals] = useState(new Map());
  const [tasksByDay, setTasksByDay] = useState(new Map());

  // --- Month ---
  const [monthViewYear, setMonthViewYear] = useState(now.getFullYear());
  const [monthlyTotals, setMonthlyTotals] = useState(new Map());

  // --- Week ---
  const [quarterAnchor, setQuarterAnchor] = useState(now);
  const [weeks, setWeeks] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    async function loadDay() {
      const monthStartKey = toDateKey(new Date(year, monthIndex, 1));
      const [stats, tasks] = await Promise.all([
        statsApi.getStatistics("day", monthStartKey),
        statsApi.getStatisticsTasks(monthStartKey),
      ]);
      if (cancelled) return;
      setDailyTotals(new Map(stats.map((row) => [row.period, row.time_secs])));
      setTasksByDay(statsApi.groupTasksByDay(tasks));
    }

    async function loadMonth() {
      const yearStartKey = toDateKey(new Date(monthViewYear, 0, 1));
      const stats = await statsApi.getStatistics("month", yearStartKey);
      if (cancelled) return;
      const totals = new Map();
      for (const row of stats) {
        totals.set(parseLocalDate(row.period).getMonth(), row.time_secs);
      }
      setMonthlyTotals(totals);
    }

    async function loadWeek() {
      const { start, end } = getQuarterInfo(quarterAnchor);
      const stats = await statsApi.getStatistics("week", toDateKey(start));
      if (cancelled) return;
      const statsMap = new Map(stats.map((row) => [row.period, row.time_secs]));
      const built = buildQuarterWeeks(start, end).map((w) => ({
        ...w,
        totalSecs: statsMap.get(w.key) ?? 0,
      }));
      setWeeks(built);
    }

    const load = granularity === "day" ? loadDay : granularity === "month" ? loadMonth : loadWeek;

    load()
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? `Failed to load statistics (${err.message}).`
            : "Failed to load statistics. Make sure the backend is running."
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [granularity, year, monthIndex, monthViewYear, quarterAnchor]);

  const navigateMonth = (delta) => {
    let nextMonth = monthIndex + delta;
    let nextYear = year;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setMonthIndex(nextMonth);
    setYear(nextYear);
  };

  const navigateQuarter = (delta) => {
    setQuarterAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta * 3, 1));
  };

  // CRUD задач для выбранного дня в календаре (в т.ч. будущие даты —
  // отправляем created_at явно, а не полагаемся на дефолт "сегодня"
  // на бэке). Обновляем локальную tasksByDay оптимистично, откатывая
  // при ошибке — тот же приём, что и в задачах на главной странице.
  const updateDayTasks = (updater) => {
    setTasksByDay((prev) => {
      const next = new Map(prev);
      next.set(selectedKey, updater(next.get(selectedKey) ?? []));
      return next;
    });
  };

  const handleAddTaskForDay = async (content) => {
    const tempId = `temp-${Date.now()}`;
    const tempTask = { id: tempId, content, status: "in_progress", created_at: selectedKey };
    updateDayTasks((list) => [...list, tempTask]);

    try {
      const created = await tasksApi.createTask({
        content,
        status: "in_progress",
        created_at: selectedKey,
      });
      updateDayTasks((list) => list.map((t) => (t.id === tempId ? created : t)));
    } catch {
      updateDayTasks((list) => list.filter((t) => t.id !== tempId));
      setLoadError("Failed to add the task.");
    }
  };

  const handleToggleTaskForDay = async (taskId) => {
    const dayTasks = tasksByDay.get(selectedKey) ?? [];
    const task = dayTasks.find((t) => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === "done" ? "in_progress" : "done";

    updateDayTasks((list) => list.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

    try {
      await tasksApi.updateTask(taskId, { status: newStatus });
    } catch {
      updateDayTasks((list) => list.map((t) => (t.id === taskId ? { ...t, status: task.status } : t)));
      setLoadError("Failed to update the task.");
    }
  };

  const handleEditTaskForDay = async (taskId, content) => {
    const dayTasks = tasksByDay.get(selectedKey) ?? [];
    const task = dayTasks.find((t) => t.id === taskId);
    if (!task) return;
    const previousContent = task.content;

    updateDayTasks((list) => list.map((t) => (t.id === taskId ? { ...t, content } : t)));

    try {
      await tasksApi.updateTask(taskId, { content });
    } catch {
      updateDayTasks((list) =>
        list.map((t) => (t.id === taskId ? { ...t, content: previousContent } : t))
      );
      setLoadError("Failed to save changes.");
    }
  };

  const handleDeleteTaskForDay = async (taskId) => {
    const previousList = tasksByDay.get(selectedKey) ?? [];
    updateDayTasks((list) => list.filter((t) => t.id !== taskId));

    try {
      await tasksApi.deleteTask(taskId);
    } catch {
      updateDayTasks(() => previousList);
      setLoadError("Failed to delete the task.");
    }
  };

  // Среднее и дельта — простое, честное определение (не гонюсь за
  // точным совпадением с цифрами макета, они там сами по себе
  // невнутреннесогласованные): среднее по всем показанным периодам,
  // дельта — последний период относительно предпоследнего.
  const dayStats = useMemo(() => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const sum = [...dailyTotals.values()].reduce((a, b) => a + b, 0);
    const avgSecs = daysInMonth ? Math.round(sum / daysInMonth) : 0;
    return { avgSecs, monthLabel: `${MONTH_NAMES[monthIndex]} ${year}` };
  }, [dailyTotals, year, monthIndex]);

  const monthStats = useMemo(() => {
    const values = MONTH_SHORT.map((_, i) => monthlyTotals.get(i) ?? 0);
    const daysInYear = ((monthViewYear % 4 === 0 && monthViewYear % 100 !== 0) || monthViewYear % 400 === 0) ? 366 : 365;
    const avgSecs = Math.round(values.reduce((a, b) => a + b, 0) / daysInYear);
    const deltaSecs = values[values.length - 1] - values[values.length - 2];
    return { avgSecs, deltaSecs, label: `${monthViewYear}`, deltaLabel: `${MONTH_SHORT[10]}` };
  }, [monthlyTotals, monthViewYear]);

  const weekStats = useMemo(() => {
    const values = weeks.map((w) => w.totalSecs);
    const avgSecs = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    const deltaSecs = values.length >= 2 ? values[values.length - 1] - values[values.length - 2] : 0;
    const { label } = getQuarterInfo(quarterAnchor);
    return { avgSecs, deltaSecs, label };
  }, [weeks, quarterAnchor]);

  const quarterInfo = getQuarterInfo(quarterAnchor);

  return (
    <div className="mx-auto mt-6 max-w-6xl">
      <h1 className="mb-6 text-center text-3xl font-semibold text-ink">Statistics</h1>

      <div className="mb-8 flex justify-center">
        <GranularityTabs value={granularity} onChange={setGranularity} />
      </div>

      {loadError && (
        <div className="mx-auto mb-6 max-w-2xl">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-danger-500/10 px-4 py-2.5 text-sm text-danger-600">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => setLoadError(null)}
              aria-label="Dismiss message"
              className="shrink-0 text-danger-600/60 hover:text-danger-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="h-96 animate-pulse rounded-3xl bg-cream-200" />
          <div className="flex flex-col gap-6">
            <div className="h-48 animate-pulse rounded-3xl bg-cream-200" />
            <div className="h-48 animate-pulse rounded-3xl bg-cream-200" />
          </div>
        </div>
      ) : granularity === "day" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="flex flex-col gap-6">
            <CalendarHeatmap
              year={year}
              monthIndex={monthIndex}
              dailyTotals={dailyTotals}
              selectedKey={selectedKey}
              onSelectDay={setSelectedKey}
              onNavigate={navigateMonth}
            />

            <div className="flex items-start gap-3 rounded-2xl bg-cream-50 px-5 py-4 text-sm text-ink/60 shadow-[0_4px_18px_rgba(73,55,44,0.08)]">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-heat-300 text-heat-600 text-xs font-semibold">
                i
              </span>
              <p>Track your time consistently to see your progress. Every hour counts!</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <TaskList
                tasks={tasksByDay.get(selectedKey) ?? []}
                onToggle={handleToggleTaskForDay}
                onEdit={handleEditTaskForDay}
                onDelete={handleDeleteTaskForDay}
                onAdd={handleAddTaskForDay}
              />
              <p className="px-1 text-right text-sm text-ink/40">{formatDayLabel(selectedKey)}</p>
            </div>
            <AverageTimeCard
              avgSecs={dayStats.avgSecs}
              deltaSecs={null}
              monthLabel={dayStats.monthLabel}
            />
          </div>
        </div>
      ) : granularity === "month" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between rounded-3xl border border-ink/5 bg-cream-50 px-5 py-4 shadow-[0_4px_18px_rgba(73,55,44,0.08)]">
              <button
                type="button"
                onClick={() => setMonthViewYear((y) => y - 1)}
                aria-label="Previous year"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream-100 text-ink/60 hover:text-ink"
              >
                ‹
              </button>
              <h2 className="text-lg font-semibold text-ink">{monthViewYear}</h2>
              <button
                type="button"
                onClick={() => setMonthViewYear((y) => y + 1)}
                aria-label="Next year"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream-100 text-ink/60 hover:text-ink"
              >
                ›
              </button>
            </div>

            <MonthGrid monthlyTotals={monthlyTotals} />
          </div>

          <div className="flex flex-col gap-6">
            <section className="w-full rounded-3xl border border-ink/5 bg-cream-50 p-5 shadow-[0_4px_18px_rgba(73,55,44,0.08)] sm:p-6">
              <h2 className="text-lg font-semibold text-ink">Hours per Month</h2>
              <div className="mt-3">
                <BarChart
                  data={MONTH_SHORT.map((label, i) => ({ label, value: monthlyTotals.get(i) ?? 0 }))}
                  thresholdHours={MONTH_THRESHOLDS_HOURS}
                />
              </div>
              <DeltaBadge deltaSecs={monthStats.deltaSecs} comparedTo={monthStats.deltaLabel} />
            </section>

            <AverageTimeCard
              avgSecs={monthStats.avgSecs}
              deltaSecs={monthStats.deltaSecs}
              monthLabel={monthStats.label}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between rounded-3xl border border-ink/5 bg-cream-50 px-5 py-4 shadow-[0_4px_18px_rgba(73,55,44,0.08)]">
              <button
                type="button"
                onClick={() => navigateQuarter(-1)}
                aria-label="Previous quarter"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream-100 text-ink/60 hover:text-ink"
              >
                ‹
              </button>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-ink">{quarterInfo.label}</h2>
                <p className="text-xs text-ink/40">
                  {formatShortDate(quarterInfo.start)} – {formatShortDate(quarterInfo.end)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateQuarter(1)}
                aria-label="Next quarter"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream-100 text-ink/60 hover:text-ink"
              >
                ›
              </button>
            </div>

            <WeekCardsGrid weeks={weeks} />
          </div>

          <div className="flex flex-col gap-6">
            <section className="w-full rounded-3xl border border-ink/5 bg-cream-50 p-5 shadow-[0_4px_18px_rgba(73,55,44,0.08)] sm:p-6">
              <h2 className="text-lg font-semibold text-ink">Weekly hours</h2>
              <p className="text-xs text-ink/40">{quarterInfo.label}</p>
              <div className="mt-3">
                <BarChart
                  data={weeks.map((w) => ({ label: `W${w.index}`, value: w.totalSecs }))}
                  thresholdHours={WEEK_THRESHOLDS_HOURS}
                />
              </div>
              <DeltaBadge deltaSecs={weekStats.deltaSecs} comparedTo="previous week" />
            </section>

            <AverageTimeCard
              avgSecs={weekStats.avgSecs}
              deltaSecs={weekStats.deltaSecs}
              monthLabel={weekStats.label}
              perLabel="week"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DeltaBadge({ deltaSecs, comparedTo }) {
  const isUp = deltaSecs >= 0;
  const h = Math.floor(Math.abs(deltaSecs) / 3600);
  const m = Math.floor((Math.abs(deltaSecs) % 3600) / 60);
  return (
    <div className="mt-4 flex items-center gap-2 rounded-xl bg-heat-100 px-4 py-2.5 text-sm text-ink">
      <span className={isUp ? "text-heat-600" : "text-ink/50"}>
        {isUp ? "↗" : "↘"}
      </span>
      {isUp ? "+" : "−"}
      {h}h {m}m {isUp ? "more" : "less"} than {comparedTo}
    </div>
  );
}
