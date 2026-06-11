"use client";

import { GroupSizeBucket, TourFormat, TourListing } from "@/types";
import {
  GROUP_SIZE_DESCRIPTIONS,
  getAvailableGroupSizes,
} from "@/data/group-format-options";
import {
  TOUR_FORMAT_OPTIONS,
  countToursByFormat,
  matchesTourFormat,
} from "@/lib/tour-format";
import { cn } from "@/lib/cn";
import { Check, Users, UserRound } from "lucide-react";
import { FilterFooter } from "./FilterPopover";

const FORMAT_ICONS = {
  group: Users,
  individual: UserRound,
} as const;

interface GroupFormatFilterProps {
  tours: TourListing[];
  selectedFormats: TourFormat[];
  selectedSizes: GroupSizeBucket[];
  onToggleFormat: (format: TourFormat) => void;
  onToggleSize: (size: GroupSizeBucket) => void;
  onClear: () => void;
  onApply: () => void;
}

function countSizesForFormats(
  tours: TourListing[],
  formats: TourFormat[]
): Partial<Record<GroupSizeBucket, number>> {
  const pool =
    formats.length === 0
      ? tours
      : tours.filter((t) => matchesTourFormat(t, formats));

  const counts: Partial<Record<GroupSizeBucket, number>> = {};
  for (const tour of pool) {
    counts[tour.groupSizeBucket] = (counts[tour.groupSizeBucket] ?? 0) + 1;
  }
  return counts;
}

export default function GroupFormatFilter({
  tours,
  selectedFormats,
  selectedSizes,
  onToggleFormat,
  onToggleSize,
  onClear,
  onApply,
}: GroupFormatFilterProps) {
  const formatCounts = countToursByFormat(tours);
  const availableSizes = getAvailableGroupSizes(selectedFormats);
  const sizeCounts = countSizesForFormats(tours, selectedFormats);

  return (
    <>
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-semibold text-charcoal">Формат тура</p>
        <p className="mt-0.5 text-xs text-slate">
          Выберите формат, затем — состав группы
        </p>
      </div>

      <div className="border-b border-gray-100 p-3">
        <div className="flex gap-2">
          {TOUR_FORMAT_OPTIONS.map(({ format, label, description }) => {
            const Icon = FORMAT_ICONS[format];
            const isSelected = selectedFormats.includes(format);
            const count = formatCounts[format];
            const disabled = count === 0;

            return (
              <button
                key={format}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onToggleFormat(format)}
                className={cn(
                  "flex flex-1 flex-col items-start gap-2 rounded-xl border px-3 py-3 text-left transition-all",
                  isSelected
                    ? "border-brand/30 bg-brand-light/60 ring-1 ring-brand/15"
                    : "border-gray-200 bg-white hover:border-gray-300",
                  disabled && "cursor-not-allowed opacity-45"
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      isSelected ? "bg-white text-brand" : "bg-gray-100 text-charcoal"
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  {count > 0 && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] tabular-nums text-slate">
                      {count}
                    </span>
                  )}
                </span>
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-charcoal">
                    {label}
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-brand" strokeWidth={2.5} />
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate">
                    {description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-charcoal">Сколько человек</p>
        <p className="mt-0.5 text-xs text-slate">
          {selectedFormats.length === 0
            ? "Сначала выберите формат или укажите размер"
            : selectedFormats.includes("individual") && selectedFormats.includes("group")
              ? "Для групповых и индивидуальных туров"
              : selectedFormats.includes("individual")
                ? "Приватный тур — можно больше двух человек"
                : "Размер набранной группы"}
        </p>
      </div>

      <ul className="max-h-56 overflow-y-auto px-2 pb-2">
        {availableSizes.map((size) => {
          const isSelected = selectedSizes.includes(size);
          const count = sizeCounts[size] ?? 0;
          const disabled = selectedFormats.length > 0 && count === 0;
          const description = GROUP_SIZE_DESCRIPTIONS[size];

          return (
            <li key={size}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onToggleSize(size)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-all",
                  isSelected
                    ? "bg-brand-light/60 ring-1 ring-brand/15"
                    : "hover:bg-gray-50",
                  disabled && "cursor-not-allowed opacity-45"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                    isSelected
                      ? "border-brand bg-brand text-white"
                      : "border-gray-300 bg-white"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-charcoal">{size}</span>
                    {count > 0 && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] tabular-nums text-slate">
                        {count}
                      </span>
                    )}
                  </span>
                  {description && (
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate">
                      {description}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <FilterFooter onClear={onClear} onApply={onApply} applyAfterClear={false} />
    </>
  );
}

export function isGroupFormatFilterActive(
  formats: TourFormat[],
  sizes: GroupSizeBucket[]
): boolean {
  return formats.length > 0 || sizes.length > 0;
}

/** Label hint for active filter button */
export function groupFormatFilterLabel(
  formats: TourFormat[],
  sizes: GroupSizeBucket[]
): string {
  if (formats.length === 0 && sizes.length === 0) return "Формат тура";
  const parts: string[] = [];
  if (formats.length === 1) {
    parts.push(
      TOUR_FORMAT_OPTIONS.find((o) => o.format === formats[0])?.shortLabel ?? formats[0]
    );
  } else if (formats.length > 1) {
    parts.push("Группа + индив.");
  }
  if (sizes.length === 1) parts.push(sizes[0]);
  else if (sizes.length > 1) parts.push(`${sizes.length} размера`);
  return parts.join(" · ") || "Формат тура";
}
