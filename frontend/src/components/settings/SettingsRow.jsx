import { useEffect, useRef, useState } from "react";

/**
 * Общий каркас строки — иконка слева, подпись, значение (или children)
 * справа, тонкий разделитель снизу. description — необязательный текст
 * под строкой (используется для дисклеймера про Date of Birth).
 */
export function SettingsRow({ icon, label, description, children }) {
  return (
    <div className="border-b border-ink/10 py-4 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream-200/70 text-ink-soft">
          {icon}
        </span>
        <span className="font-medium text-ink">{label}</span>
        <span className="ml-auto">{children}</span>
      </div>
      {description && (
        <p className="mt-2 pl-12 text-xs leading-relaxed text-ink/45">{description}</p>
      )}
    </div>
  );
}

/** Обычное read-only значение (для Email — почта не редактируется отсюда). */
export function StaticValue({ children }) {
  return <span className="text-sm text-ink/70">{children}</span>;
}

/**
 * Клик по значению превращает его в number-инпут — тот же приём, что
 * и в инлайн-редактировании задач на главной странице, для единого
 * языка взаимодействия по всему приложению.
 *
 * displayValue/unit — что показано в режиме просмотра ("25", "minutes").
 * value — то, что оказывается в инпуте при редактировании (то же число).
 * onCommit(newValue) — вызывается при Enter/blur, если значение изменилось.
 * allowEmpty — если true, пустое поле коммитит null (для Long break).
 */
export function EditableNumberRow({ value, unit, onCommit, allowEmpty = false, min = 0 }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  const commit = () => {
    setIsEditing(false);
    if (draft === "" || draft === null) {
      if (allowEmpty) {
        if (value !== null) onCommit(null);
      } else {
        setDraft(value ?? "");
      }
      return;
    }
    const num = Number(draft);
    if (Number.isFinite(num) && num >= min && num !== value) {
      onCommit(num);
    } else {
      setDraft(value ?? "");
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        autoFocus
        min={min}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value ?? "");
            setIsEditing(false);
          }
        }}
        className="w-20 rounded-lg border border-ink/15 bg-cream-50 px-2 py-1 text-right text-sm text-ink outline-none focus:border-sage-500"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value ?? "");
        setIsEditing(true);
      }}
      className="text-sm text-ink/70 hover:text-ink"
    >
      {value === null || value === undefined ? "Not set" : `${value} ${unit}`}
    </button>
  );
}

export function EditableDateRow({ value, onCommit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  const commit = () => {
    setIsEditing(false);
    const next = draft || null;
    if (next !== (value ?? null)) onCommit(next);
  };

  if (isEditing) {
    return (
      <input
        type="date"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value ?? "");
            setIsEditing(false);
          }
        }}
        className="rounded-lg border border-ink/15 bg-cream-50 px-2 py-1 text-sm text-ink outline-none focus:border-sage-500"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value ?? "");
        setIsEditing(true);
      }}
      className="text-sm text-ink/70 hover:text-ink"
    >
      {value || "dd/mm/yyyy"}
    </button>
  );
}

function PlayIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="6" y="5" width="4" height="14" />
      <rect x="14" y="5" width="4" height="14" />
    </svg>
  );
}

export function SelectRow({ value, options, onCommit, placeholder = "Select…" }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const selected = options.find((opt) => opt.id === value);
  const previewUrl = selected?.url;

  // Смена выбранного звука — останавливаем то, что играло для старого,
  // иначе можно уйти со страницы выбора со звуком, всё ещё звучащим
  // от прошлой опции.
  useEffect(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, [previewUrl]);

  useEffect(() => {
    return () => audioRef.current?.pause();
  }, []);

  const handlePreview = () => {
    if (!previewUrl) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (!audioRef.current || audioRef.current.src !== previewUrl) {
      audioRef.current = new Audio(previewUrl);
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handlePreview}
        disabled={!previewUrl}
        aria-label={isPlaying ? "Pause preview" : "Play preview"}
        title={previewUrl ? (isPlaying ? "Pause preview" : "Play preview") : "No preview for this option"}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink/50 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
      >
        {isPlaying ? <PauseIcon className="h-3 w-3" /> : <PlayIcon className="h-3 w-3" />}
      </button>

      <div className="relative">
        <select
          value={value ?? ""}
          onChange={(e) => onCommit(e.target.value || null)}
          className="appearance-none rounded-lg bg-transparent py-1 pl-2 pr-6 text-sm text-ink/70 outline-none hover:text-ink"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-ink/40"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}
