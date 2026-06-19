"use client";

import { DurationBucket } from "@/types";
import {
  DURATION_PRESETS,
  DURATION_MAX_DAYS,
  rangeFromPresets,
} from "@/data/duration-presets";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { FilterFooter } from "./FilterPopover";
import { Check } from "lucide-react";

interface DurationFilterProps {
  durationMin: number | null;
  durationMax: number | null;
  dayTripsOnly: boolean;
  selectedPresets: DurationBucket[];
  dayTripsCount: number;
  counts: Partial<Record<DurationBucket, number>>;
  onChange: (patch: {
    durationMin: number | null;
    durationMax: number | null;
    dayTripsOnly: boolean;
    durations: DurationBucket[];
  }) => void;
  onClear: () => void;
  onApply: () => void;
}

function togglePreset(arr: DurationBucket[], item: DurationBucket): DurationBucket[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export default function DurationFilter({
  durationMin,
  durationMax,
  dayTripsOnly,
  selectedPresets,
  dayTripsCount,
  counts,
  onChange,
  onClear,
  onApply,
}: DurationFilterProps) {
  const displayMin = durationMin ?? "";
  const displayMax = durationMax ?? "";
  const dayTripsDisabled = dayTripsCount === 0;

  function handleManualMin(raw: string) {
    const min = raw === "" ? null : Math.max(1, parseInt(raw, 10) || 1);
    let max = durationMax;
    if (min != null && max != null && min > max) max = min;
    onChange({
      durationMin: min,
      durationMax: max,
      dayTripsOnly: false,
      durations: [],
    });
  }

  function handleManualMax(raw: string) {
    const max = raw === "" ? null : Math.min(DURATION_MAX_DAYS, parseInt(raw, 10) || 1);
    let min = durationMin;
    if (min != null && max != null && max < min) min = max;
    onChange({
      durationMin: min,
      durationMax: max,
      dayTripsOnly: false,
      durations: [],
    });
  }

  function handlePresetToggle(bucket: DurationBucket) {
    const next = togglePreset(selectedPresets, bucket);
    if (next.length === 0) {
      onChange({
        durationMin: null,
        durationMax: null,
        dayTripsOnly: false,
        durations: [],
      });
      return;
    }
    const { min, max } = rangeFromPresets(next);
    onChange({
      durationMin: min,
      durationMax: max,
      dayTripsOnly: false,
      durations: next,
    });
  }

  function handleDayTripsOnly(checked: boolean) {
    if (checked) {
      onChange({
        durationMin: 1,
        durationMax: 1,
        dayTripsOnly: true,
        durations: [],
      });
    } else {
      onChange({
        durationMin: null,
        durationMax: null,
        dayTripsOnly: false,
        durations: [],
      });
    }
  }

  return (
    <>
      <div className="space-y-3 p-4 pb-2">
        <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-1 items-center gap-2 px-3 py-2.5">
            <span className="text-sm text-slate">от</span>
            <input
              type="number"
              min={1}
              max={DURATION_MAX_DAYS}
              placeholder="1"
              value={displayMin}
              onChange={(e) => handleManualMin(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-charcoal outline-none placeholder:text-gray-300"
            />
          </div>
          <div className="w-px bg-gray-200" />
          <div className="flex flex-1 items-center gap-2 px-3 py-2.5">
            <span className="text-sm text-slate">до</span>
            <input
              type="number"
              min={1}
              max={DURATION_MAX_DAYS}
              placeholder="30"
              value={displayMax}
              onChange={(e) => handleManualMax(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-charcoal outline-none placeholder:text-gray-300"
            />
          </div>
        </div>

        <div
          className={cn(
            "flex w-full items-center gap-3 rounded-xl bg-sky/10 px-3 py-3 text-left transition-colors hover:bg-sky/15",
            dayTripsDisabled && "cursor-not-allowed opacity-45 hover:bg-sky/10"
          )}
        >
          <Switch
            checked={dayTripsOnly}
            onCheckedChange={handleDayTripsOnly}
            disabled={dayTripsDisabled}
            aria-label="Только однодневные экскурсии"
          />
          <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-charcoal">
            Только однодневные экскурсии
          </span>
        </div>
      </div>

      <div className="px-4 pb-2">
        <p className="text-sm font-semibold text-charcoal">Или выберите из списка</p>
      </div>

      <ul className="max-h-56 overflow-y-auto bg-sky/[0.04] px-2 py-1">
        {DURATION_PRESETS.map(({ bucket }) => {
          const isSelected = selectedPresets.includes(bucket);
          const count = counts[bucket] ?? 0;
          const disabled = count === 0;

          return (
            <li key={bucket}>
              <button
                type="button"
                onClick={() => !disabled && handlePresetToggle(bucket)}
                disabled={disabled}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/80",
                  isSelected && "bg-white/60",
                  disabled && "cursor-not-allowed opacity-45"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                    isSelected
                      ? "border-brand bg-brand text-white"
                      : "border-gray-300 bg-white"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="text-sm font-medium text-charcoal">{bucket}</span>
                  {count > 0 && (
                    <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-[11px] tabular-nums text-slate">
                      {count}
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
