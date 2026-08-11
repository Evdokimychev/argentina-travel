"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown, ChevronRight, Info, Star } from "lucide-react";
import {
  ARGENTINA_SEASON_MATRIX,
  SEASON_MONTH_LABELS,
  SEASON_MONTH_SHORT,
  SEASON_SCORE_LABELS,
  SEASON_SCORE_LABELS_FULL,
  getBestDestinationsForMonth,
  getBuenosAiresMonthIndex,
  type SeasonMatrixRow,
  type SeasonScore,
} from "@/data/argentina-season-matrix";
import { ARGENTINA_SEASON_MATRIX_UI } from "@/data/argentina-season-matrix-ui";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /**
   * Подсветить текущий месяц BA после mount (hydration-safe).
   * Больше не выбирает текущий месяц как рекомендацию — только визуальная отметка.
   */
  highlightCurrentMonth?: boolean;
  /** Скрыть внутренний заголовок, если H2 уже даёт секция статьи */
  hideTitle?: boolean;
};

type CellRef = { rowId: string; monthIndex: number };

const UI = ARGENTINA_SEASON_MATRIX_UI;

const GRID_MONTH_COUNT = 12;

const MARK_TINT: Record<string, string> = {
  ba: "bg-sky/10",
  iguazu: "bg-cyan-50",
  "calafate-chalten": "bg-indigo-50",
  ushuaia: "bg-slate-100",
  bariloche: "bg-emerald-50",
  mendoza: "bg-rose-50",
  salta: "bg-amber-50",
  valdes: "bg-blue-50",
  beaches: "bg-teal-50",
  ski: "bg-violet-50",
};

function cellKey(rowId: string, monthIndex: number): string {
  return `${rowId}:${monthIndex}`;
}

function DestinationMark({
  row,
  size = "md",
}: {
  row: Pick<SeasonMatrixRow, "id" | "mark" | "name">;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg text-base leading-none",
        size === "sm" ? "h-7 w-7 text-sm" : "h-8 w-8",
        MARK_TINT[row.id] ?? "bg-gray-50",
      )}
      aria-hidden
      title={row.name}
    >
      {row.mark}
    </span>
  );
}

function ScoreGlyph({ score, compact = false }: { score: SeasonScore; compact?: boolean }) {
  if (score === 2) {
    return (
      <Star
        className={cn(
          "fill-emerald-600 text-emerald-600",
          compact ? "h-3 w-3" : "h-3.5 w-3.5",
        )}
        aria-hidden
      />
    );
  }
  return (
    <span
      className={cn(
        "rounded-full",
        compact ? "h-2 w-2" : "h-2.5 w-2.5",
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
  tabIndex,
  ariaLabel,
  onSelect,
  onKeyDown,
  registerRef,
}: {
  score: SeasonScore;
  active: boolean;
  tabIndex: number;
  ariaLabel: string;
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  registerRef: (node: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={registerRef}
      type="button"
      tabIndex={tabIndex}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition sm:h-8 sm:w-8",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1",
        active && "ring-2 ring-sky/50 ring-offset-1",
        score === 2 && "bg-emerald-100 hover:bg-emerald-200/80",
        score === 1 && "bg-amber-50 hover:bg-amber-100",
        score === 0 && "bg-slate-50 hover:bg-slate-100",
      )}
    >
      <ScoreGlyph score={score} compact />
    </button>
  );
}

function DestinationLabel({
  row,
  compact = false,
}: {
  row: SeasonMatrixRow;
  compact?: boolean;
}) {
  return (
    <Link
      href={row.href}
      className={cn(
        "group flex items-center gap-2 rounded-lg transition hover:bg-gray-50",
        compact ? "py-0.5 pr-1" : "py-1 pr-2",
      )}
    >
      <DestinationMark row={row} size={compact ? "sm" : "md"} />
      <span className="min-w-0">
        <span
          className={cn(
            "block font-medium text-charcoal group-hover:text-sky",
            compact ? "text-[13px] leading-snug" : "text-sm leading-snug",
          )}
        >
          {row.name}
        </span>
        {row.tag ? (
          <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-slate">
            {row.tag}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

/** Тонкий разделитель перед строкой-целью (лыжи), а не обычным направлением. */
function GoalRowDivider() {
  return (
    <div
      className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-violet-600"
      aria-hidden
    >
      <span className="h-px flex-1 bg-violet-200" />
      {UI.goalRowLabel}
      <span className="h-px flex-1 bg-violet-200" />
    </div>
  );
}

export default function ArgentinaSeasonMatrix({
  className,
  highlightCurrentMonth = false,
  hideTitle = true,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState<number | null>(null);
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const [focusCell, setFocusCell] = useState<CellRef | null>(null);
  const [rovingCell, setRovingCell] = useState<CellRef>({
    rowId: ARGENTINA_SEASON_MATRIX[0].id,
    monthIndex: 0,
  });
  const [showAllMobile, setShowAllMobile] = useState(false);
  const cellRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    setCurrentMonth(getBuenosAiresMonthIndex());
  }, []);

  useEffect(() => {
    setShowAllMobile(false);
  }, [activeMonth]);

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
    if (activeMonth == null) return [];
    return [...ARGENTINA_SEASON_MATRIX].sort(
      (a, b) => b.scores[activeMonth] - a.scores[activeMonth],
    );
  }, [activeMonth]);

  const visibleMobileCards = showAllMobile ? mobileCards : mobileCards.slice(0, 4);

  const selectCell = useCallback((rowId: string, monthIndex: number) => {
    setFocusCell({ rowId, monthIndex });
    setActiveMonth(monthIndex);
    setRovingCell({ rowId, monthIndex });
  }, []);

  const focusCellAt = useCallback((rowIndex: number, monthIndex: number) => {
    const clampedRowIndex = Math.max(0, Math.min(ARGENTINA_SEASON_MATRIX.length - 1, rowIndex));
    const clampedMonthIndex = Math.max(0, Math.min(GRID_MONTH_COUNT - 1, monthIndex));
    const row = ARGENTINA_SEASON_MATRIX[clampedRowIndex];
    setRovingCell({ rowId: row.id, monthIndex: clampedMonthIndex });
    cellRefs.current.get(cellKey(row.id, clampedMonthIndex))?.focus();
  }, []);

  const handleCellKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, rowIndex: number, monthIndex: number) => {
      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          focusCellAt(rowIndex - 1, monthIndex);
          break;
        case "ArrowDown":
          event.preventDefault();
          focusCellAt(rowIndex + 1, monthIndex);
          break;
        case "ArrowLeft":
          event.preventDefault();
          focusCellAt(rowIndex, monthIndex - 1);
          break;
        case "ArrowRight":
          event.preventDefault();
          focusCellAt(rowIndex, monthIndex + 1);
          break;
        case "Escape":
          setFocusCell(null);
          break;
        default:
          break;
      }
    },
    [focusCellAt],
  );

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm",
        className,
      )}
      aria-label={UI.ariaLabel}
    >
      <div className="border-b border-gray-100 bg-gradient-to-r from-sky/[0.06] via-white to-emerald-50/40 px-3 py-3 sm:px-5 sm:py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            {!hideTitle ? (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky">
                  {UI.planningEyebrow}
                </p>
                <h3 className="mt-0.5 font-heading text-lg font-bold text-charcoal sm:text-xl">
                  {UI.title}
                </h3>
              </>
            ) : (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky">
                {UI.eyebrow}
              </p>
            )}
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate sm:text-sm">
              {UI.intro}
            </p>
          </div>
          {currentMonth != null ? (
            <div className="relative inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-[11px] text-slate">
              <CalendarDays className="h-3.5 w-3.5 text-sky" aria-hidden />
              {UI.currentMonthPrefix} {SEASON_MONTH_LABELS[currentMonth]}
              {highlightCurrentMonth ? (
                <span
                  className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-sky"
                  aria-hidden
                />
              ) : null}
            </div>
          ) : (
            <div
              className="h-8 w-32 animate-pulse rounded-lg border border-gray-100 bg-gray-50"
              aria-hidden
            />
          )}
        </div>
      </div>

      {/* Mobile: month chips, quick scenarios before selection, destination cards after */}
      <div className="space-y-3 p-3 md:hidden">
        <div
          className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="listbox"
          aria-label={UI.monthPickerLabel}
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
                  "inline-flex h-9 min-w-[2.5rem] shrink-0 items-center justify-center rounded-lg px-2.5 text-[11px] font-semibold uppercase transition",
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

        {activeMonth == null ? (
          <div className="space-y-2.5 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-3">
            <p className="text-xs leading-relaxed text-slate">{UI.pickMonthHint}</p>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate">
                {UI.quickScenariosTitle}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {UI.quickScenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => setActiveMonth(scenario.monthIndex)}
                    className="inline-flex h-8 items-center rounded-lg border border-sky/20 bg-white px-2.5 text-xs font-medium text-sky transition hover:bg-sky/5"
                  >
                    {scenario.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
              {visibleMobileCards.map((row) => {
                const score = row.scores[activeMonth];
                const tip = row.tips?.[activeMonth] ?? row.summary;
                return (
                  <Fragment key={row.id}>
                    {row.id === "ski" ? (
                      <li className="bg-violet-50/60 px-3 py-1.5">
                        <GoalRowDivider />
                      </li>
                    ) : null}
                    <li className="bg-white px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <DestinationMark row={row} size="sm" />
                        <div className="min-w-0 flex-1">
                          <Link
                            href={row.href}
                            className="text-sm font-medium text-charcoal hover:text-sky hover:underline"
                          >
                            {row.name}
                          </Link>
                          {row.tag ? (
                            <p className="text-[10px] uppercase tracking-wide text-slate">
                              {row.tag}
                            </p>
                          ) : null}
                        </div>
                        <span
                          className="inline-flex max-w-[6.5rem] items-center gap-1 rounded-md bg-gray-50 px-1.5 py-1 text-[10px] leading-snug text-slate"
                          aria-label={SEASON_SCORE_LABELS_FULL[score]}
                          title={SEASON_SCORE_LABELS_FULL[score]}
                        >
                          <ScoreGlyph score={score} compact />
                          {UI.scoreShort[score]}
                        </span>
                      </div>
                      {tip ? (
                        <p className="mt-1.5 pl-9 text-xs leading-relaxed text-slate">{tip}</p>
                      ) : null}
                    </li>
                  </Fragment>
                );
              })}
            </ul>
            {mobileCards.length > 4 ? (
              <button
                type="button"
                onClick={() => setShowAllMobile((prev) => !prev)}
                aria-expanded={showAllMobile}
                className="flex w-full items-center justify-center gap-1 rounded-lg border border-gray-100 bg-gray-50/60 py-2 text-xs font-medium text-sky transition hover:bg-gray-100"
              >
                {showAllMobile ? UI.showLess : UI.showMore}
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform", showAllMobile && "rotate-180")}
                  aria-hidden
                />
              </button>
            ) : null}
          </>
        )}
      </div>

      {/* Desktop: compact table with roving-tabindex score grid */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="sticky left-0 z-10 min-w-[156px] bg-gray-50/95 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate">
                {UI.destinationCol}
              </th>
              {SEASON_MONTH_SHORT.map((label, monthIndex) => {
                const isActive = activeMonth === monthIndex;
                const isCurrent = currentMonth === monthIndex;
                return (
                  <th key={label} className="px-0.5 py-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMonth((prev) => (prev === monthIndex ? null : monthIndex))
                      }
                      className={cn(
                        "mx-auto flex h-8 w-full flex-col items-center justify-center rounded-md px-0.5 text-[10px] font-semibold uppercase transition",
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
            {ARGENTINA_SEASON_MATRIX.map((row, rowIndex) => (
              <Fragment key={row.id}>
                {row.id === "ski" ? (
                  <tr aria-hidden>
                    <td colSpan={GRID_MONTH_COUNT + 1} className="bg-violet-50/40 px-3 py-1.5">
                      <GoalRowDivider />
                    </td>
                  </tr>
                ) : null}
                <tr
                  className={cn(
                    "border-b border-gray-50 transition-colors",
                    row.id === "ski" && "border-t-2 border-t-violet-100",
                    focusCell?.rowId === row.id && "bg-sky/[0.04]",
                  )}
                >
                  <th scope="row" className="sticky left-0 z-10 bg-white/95 px-2 py-1 text-left">
                    <DestinationLabel row={row} compact />
                  </th>
                  {row.scores.map((score, monthIndex) => {
                    const isColActive = activeMonth === monthIndex;
                    const isFocused =
                      focusCell?.rowId === row.id && focusCell.monthIndex === monthIndex;
                    const isTabbable =
                      rovingCell.rowId === row.id && rovingCell.monthIndex === monthIndex;
                    return (
                      <td
                        key={monthIndex}
                        className={cn(
                          "px-0.5 py-0.5 text-center",
                          isColActive && "bg-sky/[0.06]",
                        )}
                      >
                        <div className="flex justify-center">
                          <ScoreCell
                            score={score}
                            active={isFocused}
                            tabIndex={isTabbable ? 0 : -1}
                            onSelect={() => selectCell(row.id, monthIndex)}
                            onKeyDown={(event) => handleCellKeyDown(event, rowIndex, monthIndex)}
                            registerRef={(node) => {
                              const key = cellKey(row.id, monthIndex);
                              if (node) {
                                cellRefs.current.set(key, node);
                              } else {
                                cellRefs.current.delete(key);
                              }
                            }}
                            ariaLabel={`${row.name}, ${SEASON_MONTH_LABELS[monthIndex]}: ${SEASON_SCORE_LABELS_FULL[score]}`}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 border-t border-gray-100 px-3 py-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:px-5 sm:py-3.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate">
            {UI.legendTitle}
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate sm:flex-col sm:space-y-1 sm:gap-0">
            <li className="flex items-center gap-1.5">
              <Star className="h-3 w-3 fill-emerald-600 text-emerald-600" aria-hidden />
              {UI.scoreShort[2]}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
              {UI.scoreShort[1]}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" aria-hidden />
              {UI.scoreShort[0]}
            </li>
          </ul>
          <p className="mt-2 text-[10px] leading-relaxed text-slate/70">{UI.dataNote}</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5 sm:p-3">
          {focusCell && focusRow && focusScore != null ? (
            <>
              <div className="flex items-center gap-2">
                <DestinationMark row={focusRow} size="sm" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sky">
                  {focusRow.name} · {SEASON_MONTH_LABELS[focusCell.monthIndex]}
                </p>
              </div>
              <p className="mt-1 text-sm font-medium text-charcoal">
                {SEASON_SCORE_LABELS[focusScore]}
              </p>
              {focusTip ? (
                <p className="mt-1 text-xs leading-relaxed text-slate sm:text-sm">{focusTip}</p>
              ) : null}
              <Link
                href={focusRow.href}
                className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-sky hover:underline"
              >
                {UI.detailCta}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </>
          ) : activeMonth != null && monthHighlights ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sky">
                {UI.suitableIn} {SEASON_MONTH_LABELS[activeMonth]}
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {monthHighlights.slice(0, 6).map((row: SeasonMatrixRow) => (
                  <li key={row.id}>
                    <Link
                      href={row.href}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-white px-2 py-1 text-xs text-charcoal transition hover:border-sky/30 hover:text-sky"
                    >
                      <span aria-hidden>{row.mark}</span>
                      {row.name}
                      {row.scores[activeMonth] === 2 ? (
                        <Star className="h-3 w-3 fill-emerald-600 text-emerald-600" aria-hidden />
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="flex items-start gap-2 text-xs text-slate sm:text-sm">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky/70" aria-hidden />
              {UI.pickCellHint}
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
      className="h-80 animate-pulse rounded-2xl border border-gray-100 bg-gray-50"
      aria-hidden
    />
  );
}
