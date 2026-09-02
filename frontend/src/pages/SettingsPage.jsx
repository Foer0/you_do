import { useEffect, useState } from "react";
import { useSettings } from "../context/SettingsContext";
import * as settingsApi from "../api/settings";
import { MailIcon } from "../components/auth/icons";
import { CalendarIcon } from "../components/layout/icons";
import { ClockIcon, CupIcon, ArmchairIcon, SoundIcon, WaveformIcon, RepeatIcon } from "../components/settings/icons";
import {
  SettingsRow,
  StaticValue,
  EditableNumberRow,
  EditableDateRow,
  SelectRow,
} from "../components/settings/SettingsRow";
import PasswordRow from "../components/settings/PasswordRow";
import NotificationsCard from "../components/settings/NotificationsCard";

const secsToMinutes = (secs) => (secs === null || secs === undefined ? null : Math.round(secs / 60));
const minutesToSecs = (minutes) => (minutes === null ? null : Math.round(minutes * 60));

export default function SettingsPage() {
  const { settings, isLoading, error, updateSettings } = useSettings();
  const [sounds, setSounds] = useState([]);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    settingsApi
      .getAvailableSounds()
      .then((list) =>
        setSounds(list.map((s) => ({ ...s, url: settingsApi.resolveSoundUrl(s.url) })))
      )
      .catch(() => {
        // список звуков не критичен для остальной страницы — просто
        // выпадающий список останется пустым, без диалога с ошибкой
      });
  }, []);

  const handleFieldChange = async (patch) => {
    setSaveError(null);
    try {
      await updateSettings(patch);
    } catch {
      setSaveError("Failed to save — please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto mt-10 grid max-w-4xl gap-6 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-3xl bg-cream-200" />
        <div className="h-96 animate-pulse rounded-3xl bg-cream-200" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <p className="mt-10 rounded-xl bg-danger-500/10 px-4 py-2.5 text-sm text-danger-600">
        {error ?? "Failed to load settings."}
      </p>
    );
  }

  return (
    <div className="mx-auto mt-6 max-w-4xl">
      <h1 className="mb-8 text-center text-3xl font-semibold text-ink">Profile</h1>

      {saveError && (
        <p className="mb-4 rounded-xl bg-danger-500/10 px-4 py-2.5 text-center text-sm text-danger-600">
          {saveError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="w-full rounded-3xl border border-ink/5 bg-cream-50 p-5 shadow-[0_4px_18px_rgba(73,55,44,0.08)] sm:p-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-ink">Settings</h2>
          </div>

          <div className="mt-2 border-t border-ink/10">
            <SettingsRow icon={<MailIcon className="h-4 w-4" />} label="Email">
              <StaticValue>{settings.email}</StaticValue>
            </SettingsRow>

            <PasswordRow />

            <SettingsRow
              icon={<CalendarIcon className="h-4 w-4" />}
              label="Date of Birth"
              description="By entering your date of birth, you unlock your Life Calendar and agree to receive our AI newsletter."
            >
              <EditableDateRow
                value={settings.birth_date}
                onCommit={(birth_date) => handleFieldChange({ birth_date })}
              />
            </SettingsRow>

            <SettingsRow icon={<ClockIcon className="h-4 w-4" />} label="Session">
              <EditableNumberRow
                value={secsToMinutes(settings.session_secs)}
                unit="minutes"
                min={1}
                onCommit={(minutes) => handleFieldChange({ session_secs: minutesToSecs(minutes) })}
              />
            </SettingsRow>

            <SettingsRow icon={<CupIcon className="h-4 w-4" />} label="Break">
              <EditableNumberRow
                value={secsToMinutes(settings.break_secs)}
                unit="minutes"
                min={1}
                onCommit={(minutes) => handleFieldChange({ break_secs: minutesToSecs(minutes) })}
              />
            </SettingsRow>

            <SettingsRow icon={<ArmchairIcon className="h-4 w-4" />} label="Long break">
              <EditableNumberRow
                value={secsToMinutes(settings.long_break_secs)}
                unit="minutes"
                min={1}
                allowEmpty
                onCommit={(minutes) =>
                  handleFieldChange({ long_break_secs: minutesToSecs(minutes) })
                }
              />
            </SettingsRow>

            <SettingsRow
              icon={<RepeatIcon className="h-4 w-4" />}
              label="Long break every"
              description={
                settings.long_break_secs === null
                  ? "Set a Long break duration above for this to take effect."
                  : undefined
              }
            >
              <EditableNumberRow
                value={settings.long_break_trigger_session}
                unit="sessions"
                min={1}
                allowEmpty
                onCommit={(long_break_trigger_session) =>
                  handleFieldChange({ long_break_trigger_session })
                }
              />
            </SettingsRow>

            <SettingsRow icon={<SoundIcon className="h-4 w-4" />} label="Sound">
              <SelectRow
                value={settings.sound_effect}
                options={sounds}
                onCommit={(sound_effect) => handleFieldChange({ sound_effect })}
              />
            </SettingsRow>

            <SettingsRow icon={<WaveformIcon className="h-4 w-4" />} label="Sound duration">
              <EditableNumberRow
                value={settings.sound_duration_secs}
                unit="seconds"
                min={1}
                onCommit={(sound_duration_secs) => handleFieldChange({ sound_duration_secs })}
              />
            </SettingsRow>
          </div>
        </section>

        <NotificationsCard />
      </div>
    </div>
  );
}
