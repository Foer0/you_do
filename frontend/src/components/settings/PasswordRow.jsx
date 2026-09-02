import { useState } from "react";
import { LockIcon } from "../auth/icons";
import { ApiError, setAccessToken } from "../../api/client";
import * as settingsApi from "../../api/settings";
import { useSettings } from "../../context/SettingsContext";

export default function PasswordRow() {
  const { settings } = useSettings();
  // has_password === false — пользователь зашёл через Google, пароля в
  // БД для него нет (see check_password_presence_by_auth_type на бэке).
  // Пока настройки ещё не пришли, не блокируем форму заранее — считаем,
  // что пароль есть, до явного "false" от бэка.
  const hasPassword = settings?.has_password !== false;

  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const reset = () => {
    setIsEditing(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await settingsApi.updatePassword(currentPassword, newPassword, confirmPassword);
      // Смена пароля увеличивает version пользователя на бэке — старый
      // access-токен, даже ещё не истёкший по времени, станет невалидным
      // при следующей проверке. Подставляем новый сразу, без лишнего
      // 401 → refresh на следующем запросе.
      setAccessToken(data.token.access_token);
      reset();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-b border-ink/10 py-4 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream-200/70 text-ink-soft">
          <LockIcon className="h-4 w-4" />
        </span>
        <span className="font-medium text-ink">Password</span>

        {hasPassword ? (
          <button
            type="button"
            onClick={() => setIsEditing((v) => !v)}
            className="ml-auto text-sm text-ink/70 hover:text-ink"
          >
            {justSaved ? "Updated ✓" : "••••••••"}
          </button>
        ) : (
          <span
            className="ml-auto shrink-0 cursor-not-allowed text-sm text-ink/40"
            title="You signed in with Google — there's no password on this account to change."
          >
            Via Google
          </span>
        )}
      </div>

      {hasPassword && isEditing && (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 pl-12">
          <input
            type="password"
            required
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="rounded-lg border border-ink/15 bg-cream-50 px-3 py-2 text-sm text-ink outline-none focus:border-sage-500"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded-lg border border-ink/15 bg-cream-50 px-3 py-2 text-sm text-ink outline-none focus:border-sage-500"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-lg border border-ink/15 bg-cream-50 px-3 py-2 text-sm text-ink outline-none focus:border-sage-500"
          />
          {error && <p className="text-xs text-danger-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-sage-500 px-4 py-1.5 text-sm font-medium text-cream-50 disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg px-4 py-1.5 text-sm font-medium text-ink/60 hover:bg-cream-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
