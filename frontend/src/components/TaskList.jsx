import { useState } from "react";
import TaskItem from "./TaskItem";

export default function TaskList({ tasks, onToggle, onEdit, onDelete, onAdd }) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const commitAdd = () => {
    const trimmed = draft.trim();
    if (trimmed) onAdd(trimmed);
    setDraft("");
    setIsAdding(false);
  };

  return (
    <section className="w-full rounded-3xl border border-ink/5 bg-cream-50 p-5 shadow-[0_4px_18px_rgba(73,55,44,0.08)] sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Tasks</h2>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          aria-label="Add task"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-500 text-cream-50 shadow-sm transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <ul className="mt-2">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {isAdding && (
          <li className="flex items-center gap-3 border-b border-ink/10 py-3 last:border-b-0">
            <span
              aria-hidden="true"
              className="h-5 w-5 shrink-0 rounded-md border-2 border-ink-soft/30"
            />
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitAdd}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitAdd();
                if (e.key === "Escape") {
                  setDraft("");
                  setIsAdding(false);
                }
              }}
              placeholder="New task…"
              className="min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink/40 outline-none"
            />
          </li>
        )}
      </ul>

      {tasks.length === 0 && !isAdding && (
        <p className="py-6 text-center text-sm text-ink/50">
          No tasks for today — add your first one
        </p>
      )}
    </section>
  );
}
