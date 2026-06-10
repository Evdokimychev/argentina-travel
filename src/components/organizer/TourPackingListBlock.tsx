"use client";

import { SwitchField } from "@/components/ui/switch";
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

      <SwitchField
        checked={enabled}
        onCheckedChange={onEnabledChange}
        label="В этом туре нужен список вещей"
      />

      {enabled ? (
        <OrganizerRichTextField
          id="tour-packing-list"
          value={value}
          onChange={onChange}
          maxLength={ORGANIZER_TOUR_PACKING_LIST_MAX}
          rows={8}
          placeholder="Что взять с собой: одежда, обувь, документы, аптечка…"
        />
      ) : null}
    </section>
  );
}
