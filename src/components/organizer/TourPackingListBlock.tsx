"use client";

import { cn } from "@/lib/cn";
import { ORGANIZER_TOUR_PACKING_LIST_MAX } from "@/data/tour-terms-defaults";
import OrganizerRichTextField from "@/components/organizer/OrganizerRichTextField";

interface TourPackingListBlockProps {
  enabled: boolean;
  value: string;
  onEnabledChange: (enabled: boolean) => void;
  onChange: (value: string) => void;
}

export default function TourPackingListBlock({
  enabled,
  value,
  onEnabledChange,
  onChange,
}: TourPackingListBlockProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">Список вещей</h2>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onEnabledChange(!enabled)}
        className="flex w-full items-center gap-3 text-left"
      >
        <span
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 overflow-hidden rounded-full p-0.5 transition-colors duration-200",
            enabled ? "bg-brand" : "bg-gray-300"
          )}
        >
          <span
            className={cn(
              "block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
              enabled ? "translate-x-5" : "translate-x-0"
            )}
          />
        </span>
        <span className="text-sm font-semibold text-charcoal">В этом туре нужен список вещей</span>
      </button>

      {enabled ? (
        <OrganizerRichTextField
          id="tour-packing-list"
          value={value}
          onChange={onChange}
          maxLength={ORGANIZER_TOUR_PACKING_LIST_MAX}
          rows={14}
          placeholder="Опишите, что взять с собой в поездку"
        />
      ) : null}
    </section>
  );
}
