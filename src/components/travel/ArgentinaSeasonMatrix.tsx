"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Info, Star } from "lucide-react";
import {
  ARGENTINA_SEASON_MATRIX,
  SEASON_MONTH_LABELS,
  SEASON_MONTH_SHORT,
  SEASON_SCORE_LABELS,
  getBestDestinationsForMonth,
  getCurrentMonthIndex,
  type SeasonMatrixRow,
  type SeasonScore,
} from "@/data/argentina-season-matrix";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** Подсветить текущий месяц при загрузке */
  highlightCurrentMonth?: boolean;
};

function ScoreCell({
  score,
  active,
  onClick,
  onMouseEnter,
  onMouseLeave,
  ariaLabel,
}: {
  score: SeasonScore;
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={ariaLabel}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition sm:h-10 sm:w-10",
        active && "ring-2 ring-sky/50 ring-offset-1",
        score === 3 && "bg-emerald-100 hover:bg-emerald-200/80",
        score === 2 && "bg-emerald-50 hover:bg-emerald-100",
        score === 1 && "bg-amber-50 hover:bg-amber-100",
        score === 0 && "bg-red-50 hover:bg-red-100"
      )}
    >
      {score === 3 ? (
        <Star className="h-4 w-4 fill-emerald-600 text-emerald-600" aria-hidden />
      ) : (
        <span
          className={cn(
            "h-3 w-3 rounded-full",
            score === 2 && "bg-emerald-500",
            score === 1 && "bg-amber-400",
            score === 0 && "bg-red-400"
          )}
          aria-hidden
        />
      )}
    </button>
  );
}

export default function ArgentinaSeasonMatrix({
  className,
  highlightCurrentMonth = true,
}: Props) {
  const currentMonth = getCurrentMonthIndex();
  const [activeMonth, setActiveMonth] = useState<number | null>(
    highlightCurrentMonth ? currentMonth : null
  );
  const [focusCell, setFocusCell] = useState<{
    rowId: string;
    monthIndex: number;
  } | null>(null);

  const focusRow = useMemo(
    () => ARGENTINA_SEASON_MATRIX.find((row) => row.id === focusCell?.rowId),
    [focusCell?.rowId]
  );

  const focusScore = focusCell && focusRow ? focusRow.scores[focusCell.monthIndex] : null;
  const focusTip =
    focusCell && focusRow
      ? focusRow.tips?.[focusCell.monthIndex] ??
        `${SEASON_SCORE_LABELS[focusRow.scores[focusCell.monthIndex]]} — ${focusRow.name}, ${SEASON_MONTH_LABELS[focusCell.monthIndex]}`
      : null;

  const monthHighlights = useMemo(() => {
    if (activeMonth == null) return null;
    return getBestDestinationsForMonth(activeMonth);
  }, [activeMonth]);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm",
        className
      )}
      aria-label="Таблица сезонности по направлениям Аргентины"
    >
      <div className="border-b border-gray-100 bg-gradient-to-r from-sky/[0.06] via-white to-emerald-50/40 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky">
              Планирование поездки
            </p>
            <h2 className="mt-1 font-heading text-xl font-bold text-charcoal sm:text-2xl">
              Когда ехать: сводная таблица
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate">
              Нажмите на месяц — увидите лучшие направления. Наведите на ячейку — подсказка по погоде
              и сезону. Южное полушарие: лето — декабрь–февраль.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs text-slate">
            <CalendarDays className="h-4 w-4 text-sky" aria-hidden />
            Сейчас: {SEASON_MONTH_LABELS[currentMonth]}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="sticky left-0 z-10 min-w-[140px] bg-gray-50/95 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate sm:min-w-[168px] sm:px-4">
                Направление
              </th>
              {SEASON_MONTH_SHORT.map((label, monthIndex) => {
                const isActive = activeMonth === monthIndex;
                const isCurrent = monthIndex === currentMonth;
                return (
                  <th key={label} className="px-0.5 py-2 sm:px-1">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMonth((prev) => (prev === monthIndex ? null : monthIndex))
                      }
                      className={cn(
                        "mx-auto flex w-full flex-col items-center rounded-lg px-1 py-1.5 text-[10px] font-semibold uppercase transition sm:text-xs",
                        isActive
                          ? "bg-sky text-white"
                          : isCurrent
                            ? "bg-sky/10 text-sky"
                            : "text-slate hover:bg-gray-100 hover:text-charcoal"
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
                  focusCell?.rowId === row.id && "bg-sky/[0.04]"
                )}
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-white/95 px-3 py-2 text-left sm:px-4"
                >
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
                      className={cn(
                        "px-0.5 py-1 text-center sm:px-1",
                        isColActive && "bg-sky/[0.06]"
                      )}
                    >
                      <div className="flex justify-center">
                        <ScoreCell
                          score={score}
                          active={isFocused}
                          onClick={() =>
                            setFocusCell({ rowId: row.id, monthIndex })
                          }
                          onMouseEnter={() =>
                            setFocusCell({ rowId: row.id, monthIndex })
                          }
                          onMouseLeave={() => setFocusCell(null)}
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
              {SEASON_SCORE_LABELS[3]}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" aria-hidden />
              {SEASON_SCORE_LABELS[2]}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-400" aria-hidden />
              {SEASON_SCORE_LABELS[1]}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-400" aria-hidden />
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
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
              >
                Подробнее о направлении
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </>
          ) : activeMonth != null && monthHighlights ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky">
                Лучшие направления в {SEASON_MONTH_LABELS[activeMonth]}
              </p>
              <ul className="mt-2 space-y-1">
                {monthHighlights.slice(0, 6).map((row: SeasonMatrixRow) => (
                  <li key={row.id}>
                    <Link
                      href={row.href}
                      className="text-sm text-charcoal hover:text-sky hover:underline"
                    >
                      {row.name}
                      {row.scores[activeMonth] === 3 ? " ★" : ""}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="flex items-start gap-2 text-sm text-slate">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky/70" aria-hidden />
              Выберите месяц в шапке таблицы или наведите на ячейку — появится подсказка по сезону.
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
