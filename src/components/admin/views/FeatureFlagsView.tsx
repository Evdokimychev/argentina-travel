"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { Json } from "@/types/database";

type FeatureFlagItem = {
  key: string;
  enabled: boolean;
  rolloutPercent: number;
  metadata: Json;
};

type FeatureFlagsResponse = {
  items?: FeatureFlagItem[];
};

type FeatureFlagDraft = {
  enabled: boolean;
  rolloutPercent: string;
  metadataText: string;
};

const EXAMPLE_KEYS = [
  "homepage_recommendations_v2",
  "checkout_currency_default",
  "organizer_editor_v2",
] as const;

function stringifyMetadata(metadata: Json): string {
  try {
    return JSON.stringify(metadata ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

function normalizeRollout(input: string): number {
  const parsed = Number.parseInt(input, 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
}

export default function FeatureFlagsView() {
  const { data, loading, error, refresh } = useAdminApi<FeatureFlagsResponse>("/api/admin/feature-flags");
  const [drafts, setDrafts] = useState<Record<string, FeatureFlagDraft>>({});
  const [newKey, setNewKey] = useState("");
  const [newEnabled, setNewEnabled] = useState(false);
  const [newRolloutPercent, setNewRolloutPercent] = useState("0");
  const [newMetadataText, setNewMetadataText] = useState("{\n  \"description\": \"\"\n}");
  const [creating, setCreating] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  useEffect(() => {
    const nextDrafts: Record<string, FeatureFlagDraft> = {};
    for (const item of items) {
      nextDrafts[item.key] = {
        enabled: item.enabled,
        rolloutPercent: String(item.rolloutPercent ?? 0),
        metadataText: stringifyMetadata(item.metadata),
      };
    }
    setDrafts(nextDrafts);
  }, [items]);

  function updateDraft(key: string, patch: Partial<FeatureFlagDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? { enabled: false, rolloutPercent: "0", metadataText: "{}" }),
        ...patch,
      },
    }));
  }

  async function createFlag() {
    const key = newKey.trim().toLowerCase();
    if (!key) {
      window.alert("Укажите ключ флага");
      return;
    }

    let metadata: Json = {};
    try {
      metadata = JSON.parse(newMetadataText) as Json;
    } catch {
      window.alert("Metadata должна быть валидным JSON");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          enabled: newEnabled,
          rolloutPercent: normalizeRollout(newRolloutPercent),
          metadata,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось создать флаг");
      }

      setNewKey("");
      setNewEnabled(false);
      setNewRolloutPercent("0");
      setNewMetadataText("{\n  \"description\": \"\"\n}");
      await refresh();
    } catch (createError) {
      window.alert(createError instanceof Error ? createError.message : "Ошибка");
    } finally {
      setCreating(false);
    }
  }

  async function saveFlag(key: string) {
    const draft = drafts[key];
    if (!draft) return;

    let metadata: Json = {};
    try {
      metadata = JSON.parse(draft.metadataText) as Json;
    } catch {
      window.alert(`Флаг ${key}: metadata должна быть валидным JSON`);
      return;
    }

    setSavingKey(key);
    try {
      const response = await fetch("/api/admin/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          enabled: draft.enabled,
          rolloutPercent: normalizeRollout(draft.rolloutPercent),
          metadata,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось сохранить флаг");
      }
      await refresh();
    } catch (saveError) {
      window.alert(saveError instanceof Error ? saveError.message : "Ошибка");
    } finally {
      setSavingKey(null);
    }
  }

  async function deleteFlag(key: string) {
    if (!window.confirm(`Удалить флаг ${key}?`)) return;

    setDeletingKey(key);
    try {
      const response = await fetch("/api/admin/feature-flags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось удалить флаг");
      }
      await refresh();
    } catch (deleteError) {
      window.alert(deleteError instanceof Error ? deleteError.message : "Ошибка");
    } finally {
      setDeletingKey(null);
    }
  }

  return (
    <CapabilityGate capability="system.settings">
      <AdminPageShell>
        <AdminPageHeader
          title="Флаги функций и A/B"
          subtitle="Управление rollout по ключам для серверного SSR-вычисления"
          actions={
            <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <section className={`${cabinetCardClass} space-y-4 p-5`}>
          <h2 className="font-heading text-lg font-bold text-charcoal">Новый флаг</h2>
          <p className="text-sm text-slate">
            Примеры ключей: {EXAMPLE_KEYS.join(", ")}. Для частичного rollout укажите процент 1-99.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate">Ключ (snake_case)</span>
              <Input
                className="mt-1"
                value={newKey}
                onChange={(event) => setNewKey(event.target.value)}
                placeholder="homepage_recommendations_v2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate">Rollout, %</span>
              <Input
                className="mt-1"
                type="number"
                min={0}
                max={100}
                value={newRolloutPercent}
                onChange={(event) => setNewRolloutPercent(event.target.value)}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={newEnabled}
              onChange={(event) => setNewEnabled(event.target.checked)}
            />
            Включен
          </label>
          <label className="block text-sm">
            <span className="text-slate">Metadata (JSON)</span>
            <Textarea
              className="mt-1 min-h-28 font-mono text-xs"
              value={newMetadataText}
              onChange={(event) => setNewMetadataText(event.target.value)}
            />
          </label>
          <Button onClick={() => void createFlag()} loading={creating} loadingLabel="Создаём…">
            Создать флаг
          </Button>
        </section>

        <section className={`${cabinetCardClass} space-y-4 p-5`}>
          <h2 className="font-heading text-lg font-bold text-charcoal">Существующие флаги</h2>
          {items.length === 0 ? (
            <p className="text-sm text-slate">{loading ? "Загрузка…" : "Флаги пока не созданы."}</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const draft = drafts[item.key] ?? {
                  enabled: item.enabled,
                  rolloutPercent: String(item.rolloutPercent),
                  metadataText: stringifyMetadata(item.metadata),
                };
                return (
                  <li key={item.key} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-mono text-sm font-semibold text-charcoal">{item.key}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void saveFlag(item.key)}
                          loading={savingKey === item.key}
                          loadingLabel="Сохраняем…"
                        >
                          Сохранить
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void deleteFlag(item.key)}
                          loading={deletingKey === item.key}
                          loadingLabel="Удаляем…"
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <label className="block text-sm">
                        <span className="text-slate">Rollout, %</span>
                        <Input
                          className="mt-1"
                          type="number"
                          min={0}
                          max={100}
                          value={draft.rolloutPercent}
                          onChange={(event) =>
                            updateDraft(item.key, { rolloutPercent: event.target.value })
                          }
                        />
                      </label>
                      <label className="flex items-end gap-2 pb-2 text-sm">
                        <input
                          type="checkbox"
                          checked={draft.enabled}
                          onChange={(event) =>
                            updateDraft(item.key, { enabled: event.target.checked })
                          }
                        />
                        Включен
                      </label>
                    </div>
                    <label className="mt-3 block text-sm">
                      <span className="text-slate">Metadata (JSON)</span>
                      <Textarea
                        className="mt-1 min-h-28 font-mono text-xs"
                        value={draft.metadataText}
                        onChange={(event) =>
                          updateDraft(item.key, { metadataText: event.target.value })
                        }
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
