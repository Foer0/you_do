const OPTIONS = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

export default function GranularityTabs({ value, onChange }) {
  return (
    <div className="inline-flex gap-1 rounded-full border border-ink/10 bg-cream-50 p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={
            "rounded-full px-5 py-2 text-sm font-medium transition-colors " +
            (value === opt.id
              ? "bg-sage-500 text-cream-50"
              : "text-ink/60 hover:text-ink")
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
