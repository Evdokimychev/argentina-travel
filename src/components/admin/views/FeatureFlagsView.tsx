"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { Json } from "@/types/database";
import {
  jsonDraftsEqual,
  mergeServerDraftsPreservingDirty,
} from "@/lib/admin/draft-preservation";

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

type OperationFeedback = {
  variant: "success" | "error";
  title: string;
  description: string;
};

type ValidationResult<T> =
  | { value: T; error?: undefined }
  | { value?: undefined; error: string };

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

function featureFlagToDraft(item: FeatureFlagItem): FeatureFlagDraft {
  return {
    enabled: item.enabled,
    rolloutPercent: String(item.rolloutPercent ?? 0),
    metadataText: stringifyMetadata(item.metadata),
  };
}

function validateKey(input: string): string | undefined {
  const key = input.trim().toLowerCase();
  if (!key) return "Укажите ключ флага.";
  if (!/^[a-z0-9_]{2,80}$/.test(key)) {
    return "Используйте 2–80 строчных букв, цифр и знаков подчёркивания.";
  }
  return undefined;
}

function parseRollout(input: string): ValidationResult<number> {
  if (!input.trim()) return { error: "Укажите процент от 0 до 100." };
  const parsed = Number(input);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return { error: "Введите целое число от 0 до 100." };
  }
  if (parsed < 0 || parsed > 100) {
    return { error: "Процент не может быть меньше 0 или больше 100." };
  }
  return { value: parsed };
}

function jsonLineAndColumn(source: string, position: number): { line: number; column: number } {
  const beforeError = source.slice(0, Math.max(0, position));
  const lines = beforeError.split("\n");
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

function parseMetadata(input: string): ValidationResult<Json> {
  if (!input.trim()) return { error: "Metadata не может быть пустой. Используйте {} без данных." };
  try {
    return { value: JSON.parse(input) as Json };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const lineColumnMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    if (lineColumnMatch) {
      return {
        error: `Некорректный JSON: строка ${lineColumnMatch[1]}, столбец ${lineColumnMatch[2]}.`,
      };
    }

    const positionMatch = message.match(/position\s+(\d+)/i);
    if (positionMatch) {
      const location = jsonLineAndColumn(input, Number(positionMatch[1]));
      return {
        error: `Некорректный JSON: строка ${location.line}, столбец ${location.column}.`,
      };
    }
    return { error: "Некорректный JSON. Проверьте кавычки, запятые и скобки." };
  }
}

export default function FeatureFlagsView() {
  const { data, loading, error, refresh } = useAdminApi<FeatureFlagsResponse>("/api/admin/feature-flags");
  const [drafts, setDrafts] = useState<Record<string, FeatureFlagDraft>>({});
  const [baselines, setBaselines] = useState<Record<string, FeatureFlagDraft>>({});
  const draftsRef = useRef(drafts);
  const baselinesRef = useRef(baselines);
  draftsRef.current = drafts;
  baselinesRef.current = baselines;
  const [newKey, setNewKey] = useState("");
  const [newEnabled, setNewEnabled] = useState(false);
  const [newRolloutPercent, setNewRolloutPercent] = useState("0");
  const [newMetadataText, setNewMetadataText] = useState("{\n  \"description\": \"\"\n}");
  const [creating, setCreating] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [createAttempted, setCreateAttempted] = useState(false);
  const [metadataTouched, setMetadataTouched] = useState(false);
  const [rolloutTouched, setRolloutTouched] = useState(false);
  const [feedback, setFeedback] = useState<OperationFeedback | null>(null);

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const newKeyError = validateKey(newKey);
  const newRollout = parseRollout(newRolloutPercent);
  const newMetadata = parseMetadata(newMetadataText);

  useEffect(() => {
    const serverDrafts: Record<string, FeatureFlagDraft> = {};
    for (const item of items) {
      serverDrafts[item.key] = featureFlagToDraft(item);
    }
    const merged = mergeServerDraftsPreservingDirty(
      draftsRef.current,
      baselinesRef.current,
      serverDrafts,
    );
    draftsRef.current = merged.drafts;
    baselinesRef.current = merged.baselines;
    setDrafts(merged.drafts);
    setBaselines(merged.baselines);
  }, [items]);

  function updateDraft(key: string, patch: Partial<FeatureFlagDraft>) {
    setFeedback(null);
    setDrafts((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? { enabled: false, rolloutPercent: "0", metadataText: "{}" }),
        ...patch,
      },
    }));
  }

  async function createFlag() {
    setCreateAttempted(true);
    const key = newKey.trim().toLowerCase();
    if (newKeyError || newRollout.error || newMetadata.error) return;

    setFeedback(null);
    setCreating(true);
    try {
      const response = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          enabled: newEnabled,
          rolloutPercent: newRollout.value,
          metadata: newMetadata.value,
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
      setCreateAttempted(false);
      setMetadataTouched(false);
      setRolloutTouched(false);
      await refresh();
      setFeedback({
        variant: "success",
        title: "Флаг создан",
        description: `${key} сохранён и доступен для серверного вычисления.`,
      });
    } catch (createError) {
      setFeedback({
        variant: "error",
        title: "Не удалось создать флаг",
        description: createError instanceof Error ? createError.message : "Попробуйте ещё раз.",
      });
    } finally {
      setCreating(false);
    }
  }

  async function saveFlag(key: string) {
    const draft = drafts[key];
    if (!draft) return;

    const rollout = parseRollout(draft.rolloutPercent);
    const metadata = parseMetadata(draft.metadataText);
    if (rollout.error || metadata.error) return;

    setFeedback(null);
    setSavingKey(key);
    try {
      const response = await fetch("/api/admin/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          enabled: draft.enabled,
          rolloutPercent: rollout.value,
          metadata: metadata.value,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось сохранить флаг");
      }
      const nextBaselines = { ...baselinesRef.current, [key]: draft };
      baselinesRef.current = nextBaselines;
      setBaselines(nextBaselines);
      await refresh();
      setFeedback({
        variant: "success",
        title: "Изменения сохранены",
        description: `Настройки ${key} обновлены.`,
      });
    } catch (saveError) {
      setFeedback({
        variant: "error",
        title: "Не удалось сохранить флаг",
        description: saveError instanceof Error ? saveError.message : "Попробуйте ещё раз.",
      });
    } finally {
      setSavingKey(null);
    }
  }

  async function deleteFlag(key: string) {
    if (!window.confirm(`Удалить флаг ${key}?`)) return;

    setFeedback(null);
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
      setFeedback({
        variant: "success",
        title: "Флаг удалён",
        description: `${key} больше не участвует в вычислении функций.`,
      });
    } catch (deleteError) {
      setFeedback({
        variant: "error",
        title: "Не удалось удалить флаг",
        description: deleteError instanceof Error ? deleteError.message : "Попробуйте ещё раз.",
      });
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

        {error ? (
          <InlineFeedback variant="error" title="Не удалось загрузить флаги" description={error} />
        ) : null}
        {feedback ? (
          <InlineFeedback
            variant={feedback.variant}
            title={feedback.title}
            description={feedback.description}
          />
        ) : null}

        <section className={`${cabinetCardClass} space-y-4 p-5`}>
          <h2 className="font-heading text-lg font-bold text-charcoal">Новый флаг</h2>
          <p className="text-sm text-slate">
            Примеры ключей: {EXAMPLE_KEYS.join(", ")}. Для частичного rollout укажите процент 1-99.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void createFlag();
            }}
            noValidate
            className="space-y-4"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                id="new-flag-key"
                label="Ключ (snake_case)"
                hint="Например, homepage_recommendations_v2."
                error={createAttempted || newKey ? newKeyError : undefined}
                required
              >
                <Input
                  value={newKey}
                  onChange={(event) => {
                    setNewKey(event.target.value);
                    setFeedback(null);
                  }}
                  placeholder="homepage_recommendations_v2"
                  autoComplete="off"
                  required
                />
              </FormField>
              <FormField
                id="new-flag-rollout"
                label="Rollout, %"
                hint="0 — никому, 100 — всем пользователям."
                error={createAttempted || rolloutTouched ? newRollout.error : undefined}
                required
              >
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={newRolloutPercent}
                  onChange={(event) => {
                    setNewRolloutPercent(event.target.value);
                    setRolloutTouched(true);
                    setFeedback(null);
                  }}
                  required
                />
              </FormField>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newEnabled}
                onChange={(event) => setNewEnabled(event.target.checked)}
              />
              Включен
            </label>
            <FormField
              id="new-flag-metadata"
              label="Metadata (JSON)"
              hint="JSON проверяется сразу при вводе. Для пустого объекта используйте {}."
              error={createAttempted || metadataTouched ? newMetadata.error : undefined}
              required
            >
              <Textarea
                className="min-h-28 font-mono text-xs"
                value={newMetadataText}
                onChange={(event) => {
                  setNewMetadataText(event.target.value);
                  setMetadataTouched(true);
                  setFeedback(null);
                }}
                spellCheck={false}
                required
              />
            </FormField>
            <Button type="submit" loading={creating} loadingLabel="Создаём…">
              Создать флаг
            </Button>
          </form>
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
                const rollout = parseRollout(draft.rolloutPercent);
                const metadata = parseMetadata(draft.metadataText);
                const hasValidationError = Boolean(rollout.error || metadata.error);
                const isDirty = !jsonDraftsEqual(draft, baselines[item.key] ?? draft);
                return (
                  <li key={item.key} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-semibold text-charcoal">{item.key}</p>
                        <p className={`mt-1 text-xs ${isDirty ? "text-amber-700" : "text-slate"}`}>
                          {isDirty ? "Есть несохранённые изменения" : "Сохранено"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void saveFlag(item.key)}
                          loading={savingKey === item.key}
                          loadingLabel="Сохраняем…"
                          disabled={!isDirty || hasValidationError || deletingKey === item.key}
                        >
                          Сохранить
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void deleteFlag(item.key)}
                          loading={deletingKey === item.key}
                          loadingLabel="Удаляем…"
                          disabled={savingKey === item.key}
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <FormField
                        id={`flag-${item.key}-rollout`}
                        label="Rollout, %"
                        error={rollout.error}
                        required
                      >
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={draft.rolloutPercent}
                          onChange={(event) =>
                            updateDraft(item.key, { rolloutPercent: event.target.value })
                          }
                          required
                        />
                      </FormField>
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
                    <FormField
                      id={`flag-${item.key}-metadata`}
                      label="Metadata (JSON)"
                      hint="JSON проверяется при вводе."
                      error={metadata.error}
                      required
                      className="mt-3"
                    >
                      <Textarea
                        className="min-h-28 font-mono text-xs"
                        value={draft.metadataText}
                        onChange={(event) =>
                          updateDraft(item.key, { metadataText: event.target.value })
                        }
                        spellCheck={false}
                        required
                      />
                    </FormField>
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
