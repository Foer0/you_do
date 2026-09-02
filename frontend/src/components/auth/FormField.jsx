export default function FormField({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  trailing,
  required = true,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <span className="flex items-center gap-3 rounded-xl border border-ink/10 bg-cream-50 px-3.5 py-2.5 focus-within:border-sage-500 transition-colors">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sage-400/40 text-ink-soft">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
        />
        {trailing}
      </span>
    </label>
  );
}
