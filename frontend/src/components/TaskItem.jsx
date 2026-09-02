import { useState } from "react";

function TrashIcon(props) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(task.content ?? "");
  const done = task.status === "done";

  const commitEdit = () => {
    setIsEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== task.content) {
      onEdit(task.id, trimmed);
    } else {
      setDraft(task.content ?? "");
    }
  };

  const cancelEdit = () => {
    setDraft(task.content ?? "");
    setIsEditing(false);
  };

  return (
    <li className="flex items-center gap-3 border-b border-ink/10 py-3 last:border-b-0">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Mark "${task.content}" as not done` : `Mark "${task.content}" as done`}
        onClick={() => onToggle(task.id)}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-ink-soft/70 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600"
      >
        {done && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-sage-600">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {isEditing ? (
        // min-w-0 обязателен: у input есть неявный min-width, который
        // не подчиняется flex-1 сам по себе и выталкивает соседей
        // (корзину) за пределы блока — классическая flexbox-ловушка.
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") cancelEdit();
          }}
          className="min-w-0 flex-1 bg-transparent text-ink outline-none"
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={
            "min-w-0 flex-1 cursor-text truncate " + (done ? "text-ink/40 line-through" : "text-ink")
          }
        >
          {task.content}
        </span>
      )}

      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
        className="shrink-0 text-clay-500/50 transition-colors hover:text-clay-600"
      >
        <TrashIcon />
      </button>
    </li>
  );
}
