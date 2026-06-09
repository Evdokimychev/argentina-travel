"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlignLeft,
  Bold,
  Check,
  Circle,
  Italic,
  List,
  ListOrdered,
  Plus,
  Redo2,
  RemoveFormatting,
  Trash2,
  Underline,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createDefaultOrganizerCancellation,
  type OrganizerCancellationPenalty,
  type OrganizerCancellationPolicyType,
  type OrganizerCancellationSettings,
} from "@/types/organizer-profile";
import { readOrganizerProfile, updateOrganizerProfile } from "@/lib/organizer-profile-store";
import { cn } from "@/lib/cn";

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-sky/10 px-4 py-3 text-sm leading-relaxed text-charcoal">
      {children}
    </div>
  );
}

function SaveSidebar({
  saved,
  loading,
}: {
  saved: boolean;
  loading: boolean;
}) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-[calc(var(--site-header-height,72px)+1rem)] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-base font-bold text-charcoal">Отмена бронирования</h2>
        {saved ? <p className="mt-2 text-sm text-emerald-700">Изменения сохранены</p> : null}
        <Button type="submit" className="mt-4 w-full" disabled={loading}>
          <Check className="h-4 w-4" />
          {loading ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>
    </aside>
  );
}

function buildTouristPreview(settings: OrganizerCancellationSettings): string {
  if (settings.policyType === "standard") {
    return "При отмене бронирования туристу возвращается полная сумма за вычетом организационных расходов.";
  }

  const filled = settings.penalties.filter(
    (penalty) => penalty.amount.trim() && penalty.period.trim()
  );

  if (filled.length === 0) {
    return "Штрафные санкции отсутствуют";
  }

  return filled
    .map((penalty) => `${penalty.amount.trim()} — ${penalty.period.trim()}`)
    .join("; ");
}

function PolicyCard({
  selected,
  title,
  description,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors sm:p-5",
        selected
          ? "border-sky bg-sky/5 ring-1 ring-sky/20"
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-sky bg-sky text-white" : "border-gray-300 bg-white text-transparent"
        )}
      >
        {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : <Circle className="h-3 w-3" />}
      </span>
      <span>
        <span className="block text-sm font-semibold text-charcoal">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-slate">{description}</span>
      </span>
    </button>
  );
}

function RichTextToolbar({
  onAction,
}: {
  onAction: (action: string) => void;
}) {
  const tools = [
    { id: "bold", icon: Bold, label: "Жирный" },
    { id: "italic", icon: Italic, label: "Курсив" },
    { id: "underline", icon: Underline, label: "Подчёркнутый" },
    { id: "bullet", icon: List, label: "Маркированный список" },
    { id: "ordered", icon: ListOrdered, label: "Нумерованный список" },
    { id: "clear", icon: RemoveFormatting, label: "Очистить форматирование" },
    { id: "align", icon: AlignLeft, label: "Выравнивание" },
    { id: "undo", icon: Undo2, label: "Отменить" },
    { id: "redo", icon: Redo2, label: "Повторить" },
  ] as const;

  return (
    <div className="flex flex-wrap gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
      {tools.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          title={label}
          onClick={() => onAction(id)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate transition-colors hover:bg-white hover:text-charcoal"
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}

interface OrganizerCancellationTabProps {
  userId: string;
}

export default function OrganizerCancellationTab({ userId }: OrganizerCancellationTabProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [settings, setSettings] = useState<OrganizerCancellationSettings>(
    createDefaultOrganizerCancellation()
  );
  const [history, setHistory] = useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const profile = readOrganizerProfile(userId);
    setSettings(profile.cancellation);
    setHistory([profile.cancellation.additionalConditions]);
    setHistoryIndex(0);
  }, [userId]);

  function markDirty() {
    setSaved(false);
    setError(null);
  }

  function updateSettings(patch: Partial<OrganizerCancellationSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
    markDirty();
  }

  function updatePenalty(index: number, patch: Partial<OrganizerCancellationPenalty>) {
    setSettings((prev) => {
      const penalties = prev.penalties.map((penalty, i) =>
        i === index ? { ...penalty, ...patch } : penalty
      );
      return { ...prev, penalties };
    });
    markDirty();
  }

  function addPenalty() {
    setSettings((prev) => ({
      ...prev,
      penalties: [...prev.penalties, { amount: "", period: "" }],
    }));
    markDirty();
  }

  function removePenalty(index: number) {
    setSettings((prev) => ({
      ...prev,
      penalties: prev.penalties.filter((_, i) => i !== index),
    }));
    markDirty();
  }

  function pushHistory(value: string) {
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(value);
      return next;
    });
    setHistoryIndex((prev) => prev + 1);
  }

  function applyTextareaWrap(before: string, after: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { value, selectionStart, selectionEnd } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);
    const nextValue =
      value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);

    updateSettings({ additionalConditions: nextValue });
    pushHistory(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = selectionStart + before.length + selected.length + after.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function handleToolbarAction(action: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    switch (action) {
      case "bold":
        applyTextareaWrap("**", "**");
        break;
      case "italic":
        applyTextareaWrap("_", "_");
        break;
      case "underline":
        applyTextareaWrap("__", "__");
        break;
      case "bullet": {
        const { value, selectionStart, selectionEnd } = textarea;
        const selected = value.slice(selectionStart, selectionEnd) || "Пункт";
        const block = selected
          .split("\n")
          .map((line) => (line.startsWith("• ") ? line : `• ${line}`))
          .join("\n");
        const nextValue = value.slice(0, selectionStart) + block + value.slice(selectionEnd);
        updateSettings({ additionalConditions: nextValue });
        pushHistory(nextValue);
        break;
      }
      case "ordered": {
        const { value, selectionStart, selectionEnd } = textarea;
        const selected = value.slice(selectionStart, selectionEnd) || "Пункт";
        const block = selected
          .split("\n")
          .map((line, index) => `${index + 1}. ${line.replace(/^\d+\.\s*/, "")}`)
          .join("\n");
        const nextValue = value.slice(0, selectionStart) + block + value.slice(selectionEnd);
        updateSettings({ additionalConditions: nextValue });
        pushHistory(nextValue);
        break;
      }
      case "clear":
        updateSettings({ additionalConditions: settings.additionalConditions.replace(/[*_]/g, "") });
        pushHistory(settings.additionalConditions.replace(/[*_]/g, ""));
        break;
      case "undo":
        if (historyIndex > 0) {
          const nextIndex = historyIndex - 1;
          setHistoryIndex(nextIndex);
          updateSettings({ additionalConditions: history[nextIndex] });
        }
        break;
      case "redo":
        if (historyIndex < history.length - 1) {
          const nextIndex = historyIndex + 1;
          setHistoryIndex(nextIndex);
          updateSettings({ additionalConditions: history[nextIndex] });
        }
        break;
      default:
        break;
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const cleanedPenalties =
      settings.policyType === "individual"
        ? settings.penalties.filter((penalty) => penalty.amount.trim() || penalty.period.trim())
        : [];

    const result = updateOrganizerProfile(userId, {
      cancellation: {
        ...settings,
        penalties:
          settings.policyType === "individual" && cleanedPenalties.length > 0
            ? cleanedPenalties
            : [{ amount: "", period: "" }],
      },
    });

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setSettings(result.profile.cancellation);
    setSaved(true);
  }

  const previewText = buildTouristPreview(settings);

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-start">
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
              Шаблон условий отмены бронирования
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Настройте шаблон условий отмены бронирования — его можно будет применить в любом вашем
              туре
            </p>
          </div>

          <section className="grid gap-4 sm:grid-cols-2">
            <PolicyCard
              selected={settings.policyType === "standard"}
              title="Стандартные условия"
              description="При отмене бронирования туристу возвращается полная сумма за вычетом организационных расходов."
              onSelect={() => updateSettings({ policyType: "standard" })}
            />
            <PolicyCard
              selected={settings.policyType === "individual"}
              title="Индивидуальные условия"
              description="Вы можете задать гибкие штрафные санкции в зависимости от срока отмены бронирования."
              onSelect={() => updateSettings({ policyType: "individual" })}
            />
          </section>

          {settings.policyType === "individual" ? (
            <section className="space-y-4">
              <h2 className="font-display text-base font-bold text-charcoal">Штрафные санкции</h2>
              <InfoBox>
                <p>
                  Укажите штрафы в порядке убывания срока до начала тура. Например: «20% — от 30 до
                  15 дней до начала», «50% — за 14 дней и менее до начала».
                </p>
              </InfoBox>

              <div className="space-y-4">
                {settings.penalties.map((penalty, index) => (
                  <div
                    key={`penalty-${index}`}
                    className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] sm:items-end"
                  >
                    <div>
                      <label
                        htmlFor={`penalty-amount-${index}`}
                        className="mb-1.5 block text-xs font-medium text-charcoal"
                      >
                        Размер штрафа
                      </label>
                      <Input
                        id={`penalty-amount-${index}`}
                        value={penalty.amount}
                        placeholder="20%"
                        onChange={(event) =>
                          updatePenalty(index, { amount: event.target.value })
                        }
                      />
                      <p className="mt-1 text-xs text-slate">
                        Валюта или %. Например: 5000 ₽ или 20%.
                      </p>
                    </div>

                    <span className="hidden pb-3 text-slate sm:block" aria-hidden>
                      —
                    </span>

                    <div>
                      <label
                        htmlFor={`penalty-period-${index}`}
                        className="mb-1.5 block text-xs font-medium text-charcoal"
                      >
                        Период аннуляции
                      </label>
                      <Input
                        id={`penalty-period-${index}`}
                        value={penalty.period}
                        placeholder="за 14 дней и менее до начала"
                        onChange={(event) =>
                          updatePenalty(index, { period: event.target.value })
                        }
                      />
                      <p className="mt-1 text-xs text-slate">
                        Например: за 14 дней и менее до начала тура.
                      </p>
                    </div>

                    {settings.penalties.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removePenalty(index)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-slate transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:mb-6"
                        aria-label="Удалить штраф"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="hidden sm:block sm:w-11" />
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addPenalty}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand/20 bg-brand-light px-4 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand/10 sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Добавить штрафные санкции
              </button>
            </section>
          ) : null}

          <section className="space-y-4 border-t border-gray-100 pt-8">
            <h2 className="font-display text-base font-bold text-charcoal">Дополнительные условия</h2>
            <InfoBox>
              <p>
                Например: «Сумма бронирования может быть перенесена на другой тур автора в течение 12
                месяцев при отмене не позднее чем за 7 дней до начала».
              </p>
            </InfoBox>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <RichTextToolbar onAction={handleToolbarAction} />
              <textarea
                ref={textareaRef}
                value={settings.additionalConditions}
                rows={8}
                onChange={(event) => {
                  updateSettings({ additionalConditions: event.target.value });
                  pushHistory(event.target.value);
                }}
                className="w-full resize-y px-4 py-3 text-sm leading-relaxed text-charcoal outline-none placeholder:text-gray-400"
                placeholder="Дополнительные условия отмены…"
              />
            </div>
          </section>

          <div className="rounded-xl bg-amber-50 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">
              Турист увидит условия отмены:
            </p>
            <p className="mt-2 text-sm leading-relaxed text-charcoal">{previewText}</p>
            {settings.additionalConditions.trim() ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-charcoal">
                {settings.additionalConditions.trim()}
              </p>
            ) : null}
          </div>

          {error ? (
            <div role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {saved ? (
            <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 xl:hidden">
              Изменения сохранены
            </div>
          ) : null}

          <div className="xl:hidden">
            <Button type="submit" className="w-full" disabled={loading}>
              <Check className="h-4 w-4" />
              {loading ? "Сохраняем…" : "Сохранить"}
            </Button>
          </div>
        </div>

        <SaveSidebar saved={saved} loading={loading} />
      </div>
    </form>
  );
}
