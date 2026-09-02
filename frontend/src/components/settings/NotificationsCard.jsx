import { BellIcon } from "./icons";

export default function NotificationsCard() {
  return (
    <section className="w-full rounded-3xl border border-ink/5 bg-cream-50 p-5 shadow-[0_4px_18px_rgba(73,55,44,0.08)] sm:p-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-ink">Notifications</h2>
      </div>

      <div className="mt-2 flex flex-col items-center gap-3 border-t border-ink/10 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream-200/70 text-clay-400">
          <BellIcon className="h-6 w-6" />
        </span>
        <p className="font-semibold text-ink">You have no notifications yet</p>
        <p className="max-w-xs text-sm text-ink/50">
          We'll notify you about important updates and reminders.
        </p>
      </div>
    </section>
  );
}
