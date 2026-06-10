"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { SwitchField } from "@/components/ui/switch";
import { ORGANIZER_TOUR_CANCELLATION_TEXT_MAX } from "@/data/tour-terms-defaults";
import { buildCancellationTouristPreviewFull } from "@/lib/organizer-cancellation-preview";
import { readOrganizerProfile } from "@/lib/organizer-profile-store";

interface TourCancellationBlockProps {
  useTemplate: boolean;
  customText: string;
  onUseTemplateChange: (enabled: boolean) => void;
  onCustomTextChange: (text: string) => void;
}

export default function TourCancellationBlock({
  useTemplate,
  customText,
  onUseTemplateChange,
  onCustomTextChange,
}: TourCancellationBlockProps) {
  const { user } = useAuth();

  const templatePreview = useMemo(() => {
    const profile = readOrganizerProfile(user?.id ?? "ivan-evdokimychev");
    return buildCancellationTouristPreviewFull(profile.cancellation);
  }, [user?.id]);

  const previewText = useTemplate ? templatePreview : customText.trim();

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">Отмена бронирования</h2>

      <SwitchField
        checked={useTemplate}
        onCheckedChange={onUseTemplateChange}
        label="Использовать шаблон условий отмены"
        description={
          <>
            Для просмотра условий отмены{" "}
            <Link href="/organizer/settings" className="font-medium text-sky hover:underline">
              перейдите в настройки организатора
            </Link>
          </>
        }
      />

      {useTemplate ? (
        <div className="rounded-xl bg-amber-50 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate">
            Турист увидит условия отмены:
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-charcoal">
            {previewText}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label htmlFor="tour-custom-cancellation" className="text-xs font-medium text-charcoal">
            Условия отмены для этого тура
          </label>
          <textarea
            id="tour-custom-cancellation"
            value={customText}
            maxLength={ORGANIZER_TOUR_CANCELLATION_TEXT_MAX}
            rows={5}
            onChange={(event) => onCustomTextChange(event.target.value)}
            placeholder="Опишите условия отмены бронирования для этого тура"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-charcoal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
      )}
    </section>
  );
}
