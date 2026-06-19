"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { cn } from "@/lib/cn";
import { cabinetPanelClass } from "@/lib/cabinet-ui";
import {
  apiUpdateNotificationPreferences,
  NOTIFICATIONS_HUB_UPDATED_EVENT,
} from "@/lib/notifications/notifications-api";
import type {
  NotificationCategory,
  NotificationChannel,
  NotificationPreferenceItem,
  NotificationScope,
} from "@/types/notifications-hub";
import {
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_CHANNEL_LABELS,
  ORGANIZER_NOTIFICATION_CATEGORIES,
  TOURIST_NOTIFICATION_CATEGORIES,
} from "@/types/notifications-hub";

interface NotificationPreferencesSectionProps {
  scope: NotificationScope;
  className?: string;
}

function buildDefaultPreferences(scope: NotificationScope): NotificationPreferenceItem[] {
  const categories =
    scope === "organizer" ? ORGANIZER_NOTIFICATION_CATEGORIES : TOURIST_NOTIFICATION_CATEGORIES;
  const items: NotificationPreferenceItem[] = [];
  for (const category of categories) {
    items.push({ channel: "in_app", category, enabled: true });
    items.push({ channel: "email", category, enabled: true });
  }
  return items;
}

export default function NotificationPreferencesSection({
  scope,
  className,
}: NotificationPreferencesSectionProps) {
  const remoteEnabled = isSupabaseAuthEnabled();
  const [preferences, setPreferences] = useState<NotificationPreferenceItem[]>(() =>
    buildDefaultPreferences(scope)
  );
  const [loading, setLoading] = useState(remoteEnabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(
    () => (scope === "organizer" ? ORGANIZER_NOTIFICATION_CATEGORIES : TOURIST_NOTIFICATION_CATEGORIES),
    [scope]
  );

  useEffect(() => {
    if (!remoteEnabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/notifications/preferences?scope=${scope}`, {
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error("Не удалось загрузить настройки");
        const body = (await res.json()) as { preferences?: NotificationPreferenceItem[] };
        if (!cancelled) {
          setPreferences(
            body.preferences?.length ? body.preferences : buildDefaultPreferences(scope)
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
          setPreferences(buildDefaultPreferences(scope));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [scope, remoteEnabled]);

  function isEnabled(channel: NotificationChannel, category: NotificationCategory): boolean {
    return (
      preferences.find((item) => item.channel === channel && item.category === category)
        ?.enabled ?? true
    );
  }

  function handleToggle(channel: NotificationChannel, category: NotificationCategory) {
    setSaved(false);
    setPreferences((prev) => {
      const existing = prev.find(
        (item) => item.channel === channel && item.category === category
      );
      if (!existing) {
        return [...prev, { channel, category, enabled: false }];
      }
      return prev.map((item) =>
        item.channel === channel && item.category === category
          ? { ...item, enabled: !item.enabled }
          : item
      );
    });
  }

  async function handleSave() {
    if (!remoteEnabled) {
      setSaved(true);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await apiUpdateNotificationPreferences({ scope, preferences });
      setPreferences(updated);
      setSaved(true);
      window.dispatchEvent(new CustomEvent(NOTIFICATIONS_HUB_UPDATED_EVENT));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="notifications" className={cn(cabinetPanelClass, className)}>
      <h2 className="font-heading text-lg font-bold text-charcoal">Уведомления</h2>
      <p className="mt-1 text-sm text-slate">
        Выберите, какие события показывать в приложении и отправлять на email.
      </p>

      {loading ? <p className="mt-4 text-sm text-slate">Загрузка настроек…</p> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-slate">
              <th className="py-2 pr-4 font-medium">Категория</th>
              <th className="py-2 px-3 font-medium">{NOTIFICATION_CHANNEL_LABELS.in_app}</th>
              <th className="py-2 px-3 font-medium">{NOTIFICATION_CHANNEL_LABELS.email}</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category} className="border-b border-gray-50">
                <td className="py-3 pr-4 text-charcoal">
                  {NOTIFICATION_CATEGORY_LABELS[category]}
                </td>
                {(["in_app", "email"] as NotificationChannel[]).map((channel) => (
                  <td key={channel} className="py-3 px-3">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isEnabled(channel, category)}
                        onChange={() => handleToggle(channel, category)}
                        disabled={loading || saving}
                        className="h-4 w-4 rounded border-gray-300 text-sky focus:ring-sky/30"
                      />
                      <span className="sr-only">
                        {NOTIFICATION_CHANNEL_LABELS[channel]} —{" "}
                        {NOTIFICATION_CATEGORY_LABELS[category]}
                      </span>
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {saved ? <p className="mt-3 text-sm text-success">Настройки сохранены</p> : null}

      <div className="mt-4">
        <Button
          type="button"
          onClick={() => void handleSave()}
          loading={saving}
          loadingLabel="Сохраняем…"
        >
          Сохранить настройки
        </Button>
      </div>

      {!remoteEnabled ? (
        <p className="mt-3 text-xs text-slate">
          В локальном режиме настройки действуют только для уведомлений в браузере.
        </p>
      ) : null}
    </section>
  );
}
