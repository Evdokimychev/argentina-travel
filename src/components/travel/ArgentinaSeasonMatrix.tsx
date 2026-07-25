"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Info, Star } from "lucide-react";
import {
  ARGENTINA_SEASON_MATRIX,
  SEASON_MONTH_LABELS,
  SEASON_MONTH_SHORT,
  SEASON_SCORE_LABELS,
  getBestDestinationsForMonth,
  getBuenosAiresMonthIndex,
  type SeasonMatrixRow,
  type SeasonScore,
} from "@/data/argentina-season-matrix";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /**
   * Подсветить текущий месяц BA после mount (hydration-safe).
   * По умолчанию выкл.: текущий месяц не считается «лучшим».
   */
  highlightCurrentMonth?: boolean;
  /** Скрыть внутренний заголовок, если H2 уже даёт секция статьи */
  hideTitle?: boolean;
};

function ScoreGlyph({ score }: { score: SeasonScore }) {
  if (score === 2) {
    return <Star className="h-4 w-4 fill-emerald-600 text-emerald-600" aria-hidden />;
  }
  return (
    <span
      className={cn(
        "h-3 w-3 rounded-full",
        score === 1 && "bg-amber-400",
        score === 0 && "bg-slate-300",
      )}
      aria-hidden
    />
  );
}

function ScoreCell({
  score,
  active,
  onSelect,
  ariaLabel,
}: {
  score: SeasonScore;
  active: boolean;
  onSelect: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition sm:h-10 sm:w-10",
        active && "ring-2 ring-sky/50 ring-offset-1",
        score === 2 && "bg-emerald-100 hover:bg-emerald-200/80",
        score === 1 && "bg-amber-50 hover:bg-amber-100",
        score === 0 && "bg-slate-50 hover:bg-slate-100",
      )}
    >
      <ScoreGlyph score={score} />
    </button>
  );
}

export default function ArgentinaSeasonMatrix({
  className,
  highlightCurrentMonth = false,
  hideTitle = true,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState<number | null>(null);
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const [focusCell, setFocusCell] = useState<{
    rowId: string;
    monthIndex: number;
  } | null>(null);

  useEffect(() => {
    const month = getBuenosAiresMonthIndex();
    setCurrentMonth(month);
    if (highlightCurrentMonth) {
      setActiveMonth(month);
    }
  }, [highlightCurrentMonth]);

  const focusRow = useMemo(
    () => ARGENTINA_SEASON_MATRIX.find((row) => row.id === focusCell?.rowId),
    [focusCell?.rowId],
  );

  const focusScore = focusCell && focusRow ? focusRow.scores[focusCell.monthIndex] : null;
  const focusTip =
    focusCell && focusRow
      ? (focusRow.tips?.[focusCell.monthIndex] ??
        `${SEASON_SCORE_LABELS[focusRow.scores[focusCell.monthIndex]]} — ${focusRow.name}, ${SEASON_MONTH_LABELS[focusCell.monthIndex]}`)
      : null;

  const monthHighlights = useMemo(() => {
    if (activeMonth == null) return null;
    return getBestDestinationsForMonth(activeMonth);
  }, [activeMonth]);

  const mobileCards = useMemo(() => {
    if (activeMonth == null) return ARGENTINA_SEASON_MATRIX;
    return [...ARGENTINA_SEASON_MATRIX].sort(
      (a, b) => b.scores[activeMonth] - a.scores[activeMonth],
    );
  }, [activeMonth]);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm",
        className,
      )}
      aria-label="Таблица сезонности по направлениям Аргентины"
    >
      <div className="border-b border-gray-100 bg-gradient-to-r from-sky/[0.06] via-white to-emerald-50/40 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {!hideTitle ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky">
                  Планирование поездки
                </p>
                <h3 className="mt-1 font-heading text-xl font-bold text-charcoal sm:text-2xl">
                  Когда ехать: сводная таблица
                </h3>
              </>
            ) : (
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky">
                Ориентир по месяцам
              </p>
            )}
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate">
              Матрица — ориентир, а не прогноз. Перед поездкой проверяйте погоду, дороги, тропы и
              работу сервисов. Выберите месяц — увидите подходящие направления.
            </p>
          </div>
          {currentMonth != null ? (
            <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs text-slate">
              <CalendarDays className="h-4 w-4 text-sky" aria-hidden />
              Сейчас в Буэнос-Айресе: {SEASON_MONTH_LABELS[currentMonth]}
            </div>
          ) : (
            <div
              className="h-9 w-40 animate-pulse rounded-xl border border-gray-100 bg-gray-50"
              aria-hidden
            />
          )}
        </div>
      </div>

      {/* Mobile: month chips + destination cards */}
      <div className="space-y-4 p-4 md:hidden">
        <div
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="listbox"
          aria-label="Выбор месяца"
        >
          {SEASON_MONTH_SHORT.map((label, monthIndex) => {
            const isActive = activeMonth === monthIndex;
            const isCurrent = currentMonth === monthIndex;
            return (
              <button
                key={label}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() =>
                  setActiveMonth((prev) => (prev === monthIndex ? null : monthIndex))
                }
                className={cn(
                  "inline-flex h-11 min-w-[2.75rem] shrink-0 items-center justify-center rounded-xl px-3 text-xs font-semibold uppercase transition",
                  isActive
                    ? "bg-sky text-white"
                    : isCurrent
                      ? "bg-sky/10 text-sky"
                      : "bg-gray-50 text-slate hover:bg-gray-100",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <ul className="space-y-3">
          {mobileCards.map((row) => {
            const score = activeMonth != null ? row.scores[activeMonth] : null;
            const tip =
              activeMonth != null
                ? (row.tips?.[activeMonth] ?? row.summary)
                : row.summary;
            return (
              <li
                key={row.id}
                className="rounded-xl border border-gray-100 bg-gray-50/50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={row.href}
                      className="font-medium text-charcoal hover:text-sky hover:underline"
                    >
                      {row.name}
                    </Link>
                    {row.tag ? (
                      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate">
                        {row.tag}
                      </p>
                    ) : null}
                  </div>
                  {score != null ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-xs text-slate"
                      aria-label={SEASON_SCORE_LABELS[score]}
                    >
                      <ScoreGlyph score={score} />
                      <span className="max-w-[7.5rem] leading-snug">
                        {SEASON_SCORE_LABELS[score]}
                      </span>
                    </span>
                  ) : null}
                </div>
                {tip ? <p className="mt-2 text-sm leading-relaxed text-slate">{tip}</p> : null}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Desktop: compact table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="sticky left-0 z-10 min-w-[168px] bg-gray-50/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate">
                Направление
              </th>
              {SEASON_MONTH_SHORT.map((label, monthIndex) => {
                const isActive = activeMonth === monthIndex;
                const isCurrent = currentMonth === monthIndex;
                return (
                  <th key={label} className="px-1 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMonth((prev) => (prev === monthIndex ? null : monthIndex))
                      }
                      className={cn(
                        "mx-auto flex min-h-11 w-full flex-col items-center rounded-lg px-1 py-1.5 text-xs font-semibold uppercase transition",
                        isActive
                          ? "bg-sky text-white"
                          : isCurrent
                            ? "bg-sky/10 text-sky"
                            : "text-slate hover:bg-gray-100 hover:text-charcoal",
                      )}
                      aria-pressed={isActive}
                    >
                      {label}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ARGENTINA_SEASON_MATRIX.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-gray-50 transition-colors",
                  focusCell?.rowId === row.id && "bg-sky/[0.04]",
                )}
              >
                <th scope="row" className="sticky left-0 z-10 bg-white/95 px-4 py-2 text-left">
                  <Link
                    href={row.href}
                    className="group block rounded-lg py-1 pr-2 transition hover:bg-gray-50"
                  >
                    <span className="font-medium text-charcoal group-hover:text-sky">
                      {row.name}
                    </span>
                    {row.tag ? (
                      <span className="mt-0.5 block text-[10px] text-slate">{row.tag}</span>
                    ) : null}
                  </Link>
                </th>
                {row.scores.map((score, monthIndex) => {
                  const isColActive = activeMonth === monthIndex;
                  const isFocused =
                    focusCell?.rowId === row.id && focusCell.monthIndex === monthIndex;
                  return (
                    <td
                      key={monthIndex}
                      className={cn("px-1 py-1 text-center", isColActive && "bg-sky/[0.06]")}
                    >
                      <div className="flex justify-center">
                        <ScoreCell
                          score={score}
                          active={isFocused}
                          onSelect={() => {
                            setFocusCell({ rowId: row.id, monthIndex });
                            setActiveMonth(monthIndex);
                          }}
                          ariaLabel={`${row.name}, ${SEASON_MONTH_LABELS[monthIndex]}: ${SEASON_SCORE_LABELS[score]}`}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 border-t border-gray-100 px-4 py-4 sm:grid-cols-2 sm:px-6 sm:py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">Обозначения</p>
          <ul className="mt-2 space-y-1.5 text-xs text-slate">
            <li className="flex items-center gap-2">
              <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" aria-hidden />
              {SEASON_SCORE_LABELS[2]}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-400" aria-hidden />
              {SEASON_SCORE_LABELS[1]}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-slate-300" aria-hidden />
              {SEASON_SCORE_LABELS[0]}
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 sm:p-4">
          {focusCell && focusRow && focusScore != null ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky">
                {focusRow.name} · {SEASON_MONTH_LABELS[focusCell.monthIndex]}
              </p>
              <p className="mt-1 text-sm font-medium text-charcoal">
                {SEASON_SCORE_LABELS[focusScore]}
              </p>
              {focusTip ? (
                <p className="mt-2 text-sm leading-relaxed text-slate">{focusTip}</p>
              ) : null}
              <Link
                href={focusRow.href}
                className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-sky hover:underline"
              >
                Подробнее о направлении
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </>
          ) : activeMonth != null && monthHighlights ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky">
                Подходящие направления в {SEASON_MONTH_LABELS[activeMonth]}
              </p>
              <ul className="mt-2 space-y-1">
                {monthHighlights.slice(0, 6).map((row: SeasonMatrixRow) => (
                  <li key={row.id}>
                    <Link
                      href={row.href}
                      className="text-sm text-charcoal hover:text-sky hover:underline"
                    >
                      {row.name}
                      {row.scores[activeMonth] === 2 ? " ★" : ""}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="flex items-start gap-2 text-sm text-slate">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky/70" aria-hidden />
              Выберите месяц или ячейку — появится подсказка по сезону.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function ArgentinaSeasonMatrixSkeleton() {
  return (
    <div
      className="h-96 animate-pulse rounded-2xl border border-gray-100 bg-gray-50"
      aria-hidden
    />
  );
}
