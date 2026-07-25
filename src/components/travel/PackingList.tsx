"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PACKING_LIST_UI,
  PACKING_SCENARIO_OPTIONS,
  PACKING_SEASON_OPTIONS,
  PATAGONIA_PACKING_ITEMS,
  type PackingItem,
  type PackingScenario,
  type PackingSeason,
} from "@/data/patagonia-packing-list";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  items?: PackingItem[];
  labels?: typeof PACKING_LIST_UI;
  /** Формат поездки по умолчанию — влияет на первичную фильтрацию после монтирования. */
  defaultScenario?: PackingScenario;
};

/** Показывать ли вещь при выбранном формате поездки. */
export function isVisibleForScenario(item: PackingItem, scenario: PackingScenario): boolean {
  const scenarios = item.scenarios ?? [];
  if (scenarios.length === 0) {
    // Базовые вещи видны во всех сценариях, кроме снаряжения только для трека.
    if (item.advancedOnly) return scenario === "multi-day";
    return true;
  }
  return scenarios.includes(scenario);
}

/** Показывать ли вещь при выбранном сезоне. */
export function isVisibleForSeason(item: PackingItem, season: PackingSeason): boolean {
  if (season === "any") return true;
  const seasons = item.seasons ?? ["any"];
  return seasons.includes("any") || seasons.includes(season);
}

export function filterPackingItems(
  items: PackingItem[],
  filters: { scenario: PackingScenario; season: PackingSeason; query: string },
): PackingItem[] {
  const query = filters.query.trim().toLowerCase();
  return items.filter((item) => {
    if (!isVisibleForScenario(item, filters.scenario)) return false;
    if (!isVisibleForSeason(item, filters.season)) return false;
    if (query.length > 0 && !item.label.toLowerCase().includes(query)) return false;
    return true;
  });
}

export type PackingGroup = { group: string; items: PackingItem[] };

/** Группирует вещи по названию группы, сохраняя порядок первого появления. */
export function groupPackingItems(items: PackingItem[]): PackingGroup[] {
  const groups: PackingGroup[] = [];
  const index = new Map<string, PackingGroup>();
  for (const item of items) {
    let bucket = index.get(item.group);
    if (!bucket) {
      bucket = { group: item.group, items: [] };
      index.set(item.group, bucket);
      groups.push(bucket);
    }
    bucket.items.push(item);
  }
  return groups;
}

function buildMarkdownChecklist(items: PackingItem[], checked: ReadonlySet<string>): string {
  return items
    .map((item) => `- [${checked.has(item.id) ? "x" : " "}] ${item.label}`)
    .join("\n");
}

/**
 * Универсальный интерактивный список вещей.
 * Прогрессивное улучшение: без JS в HTML отдаётся полный список с чекбоксами;
 * фильтры, прогресс и кнопки появляются только после монтирования.
 */
export default function PackingList({
  className,
  items = PATAGONIA_PACKING_ITEMS,
  labels = PACKING_LIST_UI,
  defaultScenario = "city",
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [scenario, setScenario] = useState<PackingScenario>(defaultScenario);
  const [season, setSeason] = useState<PackingSeason>("any");
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // localStorage читаем только после монтирования — SSR остаётся чистым.
  useEffect(() => {
    setMounted(true);
    try {
      const raw = window.localStorage.getItem(labels.storageKey);
      if (raw) {
        const ids = JSON.parse(raw) as unknown;
        if (Array.isArray(ids)) {
          setChecked(new Set(ids.filter((id): id is string => typeof id === "string")));
        }
      }
    } catch {
      // Приватный режим или недоступный storage — работаем без сохранения.
    }
  }, [labels.storageKey]);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(labels.storageKey, JSON.stringify([...checked]));
    } catch {
      // Игнорируем ошибки записи.
    }
  }, [checked, mounted, labels.storageKey]);

  // До монтирования показываем полный список (no-JS readable).
  const visibleItems = useMemo(
    () => (mounted ? filterPackingItems(items, { scenario, season, query }) : items),
    [mounted, items, scenario, season, query],
  );

  const groups = useMemo(() => groupPackingItems(visibleItems), [visibleItems]);

  const checkedVisibleCount = useMemo(
    () => visibleItems.reduce((count, item) => count + (checked.has(item.id) ? 1 : 0), 0),
    [visibleItems, checked],
  );

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => setChecked(new Set());

  const print = () => {
    if (typeof window !== "undefined") window.print();
  };

  const copyList = async () => {
    const markdown = buildMarkdownChecklist(visibleItems, checked);
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const total = visibleItems.length;

  return (
    <section
      className={cn(
        "ga-packing-list rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
      aria-label={labels.ariaLabel}
    >
      <div className="ga-packing-list__head">
        <h3 className="font-heading text-base font-semibold text-charcoal">{labels.title}</h3>
        <p className="mt-1 text-sm text-slate">{labels.hint}</p>
      </div>

      {/* Панель управления — прогрессивное улучшение, скрыта при печати. */}
      {mounted ? (
        <div className="ga-packing-list__controls mt-4 space-y-3 print:hidden">
          <div>
            <label
              htmlFor="ga-packing-search"
              className="block text-xs font-semibold uppercase tracking-wide text-slate"
            >
              {labels.searchLabel}
            </label>
            <input
              id="ga-packing-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.searchPlaceholder}
              className="mt-1 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-charcoal outline-none transition focus:border-sky/50 focus:ring-2 focus:ring-sky/30"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate">
              {labels.scenarioLabel}
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-2" role="list">
              {PACKING_SCENARIO_OPTIONS.map((option) => {
                const active = option.id === scenario;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      title={option.description}
                      onClick={() => setScenario(option.id)}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition motion-reduce:transition-none",
                        active
                          ? "border-sky bg-sky text-white"
                          : "border-gray-200 bg-white text-charcoal hover:border-sky/40",
                      )}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <label
              htmlFor="ga-packing-season"
              className="block text-xs font-semibold uppercase tracking-wide text-slate"
            >
              {labels.seasonLabel}
            </label>
            <select
              id="ga-packing-season"
              value={season}
              onChange={(event) => setSeason(event.target.value as PackingSeason)}
              className="mt-1 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-charcoal outline-none transition focus:border-sky/50 focus:ring-2 focus:ring-sky/30 sm:w-auto"
            >
              {PACKING_SEASON_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-charcoal" aria-live="polite">
              {labels.progressLabel}: {checkedVisibleCount}/{total}
            </p>
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={reset}
                className="blog-touch-target inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-charcoal transition hover:border-sky/40 motion-reduce:transition-none"
              >
                {labels.resetLabel}
              </button>
              <button
                type="button"
                onClick={print}
                className="blog-touch-target inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-charcoal transition hover:border-sky/40 motion-reduce:transition-none"
              >
                {labels.printLabel}
              </button>
              <button
                type="button"
                onClick={() => void copyList()}
                className="blog-touch-target inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-sky transition hover:border-sky/40 motion-reduce:transition-none"
              >
                {copied ? labels.copiedLabel : labels.copyLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="ga-packing-list__groups mt-4 space-y-5">
        {groups.length === 0 ? (
          <p className="text-sm text-slate">{labels.emptyLabel}</p>
        ) : (
          groups.map((group) => (
            <div key={group.group}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate">
                {group.group}
              </h4>
              <ul className="mt-2 space-y-1.5" role="list">
                {group.items.map((item) => {
                  const isChecked = checked.has(item.id);
                  const inputId = `ga-packing-${item.id}`;
                  return (
                    <li key={item.id}>
                      <label
                        htmlFor={inputId}
                        className="blog-touch-target flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-surface-muted/40 px-3 py-2 transition hover:border-sky/30 motion-reduce:transition-none"
                      >
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(item.id)}
                          className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-sky accent-sky"
                        />
                        <span className="min-w-0">
                          <span
                            className={cn(
                              "block text-sm leading-snug text-charcoal",
                              isChecked && "line-through opacity-60",
                            )}
                          >
                            {item.label}
                          </span>
                          {item.note ? (
                            <span className="mt-0.5 block text-xs leading-relaxed text-slate">
                              <span className="font-semibold text-charcoal">{labels.noteLabel}: </span>
                              {item.note}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
