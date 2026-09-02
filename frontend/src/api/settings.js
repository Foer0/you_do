import { api, resolveAssetUrl } from "./client";

export function getSettings() {
  return api.get("/users/me/settings");
}

/**
 * ПРЕДПОЛОЖЕНИЕ: SettingUpdate поддерживает частичное обновление
 * (exclude_unset на бэке, как у TaskUpdate) — шлём только то поле,
 * которое реально поменялось. session_secs/break_secs/long_break_secs —
 * в секундах (конвертация из минут делается на фронте, до вызова этой
 * функции). sound_effect — id звука (строка), sound_duration_secs — в
 * секундах напрямую (без конвертации).
 */
export function updateSettings(patch) {
  return api.patch("/users/me/settings", patch);
}

// current_password — ориентируюсь на исправленное имя поля
// (в присланной схеме была опечатка "current_passwword").
export function updatePassword(currentPassword, newPassword, confirmPassword) {
  return api.patch("/users/me/settings/password", {
    current_password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
}

export function getAvailableSounds() {
  return api.get("/users/me/settings/sounds");
}

// URL из SOUNDS — относительный путь на БЭКЕНДЕ ("/static/sounds/bell.mp3"),
// а не на фронтенде. Без resolveAssetUrl браузер резолвил бы его
// относительно localhost:5173, где такого файла нет.
export function resolveSoundUrl(path) {
  return resolveAssetUrl(path);
}
