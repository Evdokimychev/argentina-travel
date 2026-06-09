"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { ORGANIZER_TOUR_CANCELLATION_TEXT_MAX } from "@/data/tour-terms-defaults";
import { buildCancellationTouristPreviewFull } from "@/lib/organizer-cancellation-preview";
import { readOrganizerProfile } from "@/lib/organizer-profile-store";
import { cn } from "@/lib/cn";

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

      <div className="flex items-start gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={useTemplate}
          onClick={() => onUseTemplateChange(!useTemplate)}
          className="mt-0.5 shrink-0"
          aria-label="Использовать шаблон условий отмены"
        >
          <span
            className={cn(
              "relative inline-flex h-6 w-11 overflow-hidden rounded-full p-0.5 transition-colors duration-200",
              useTemplate ? "bg-brand" : "bg-gray-300"
            )}
          >
            <span
              className={cn(
                "block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
                useTemplate ? "translate-x-5" : "translate-x-0"
              )}
            />
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-charcoal">Использовать шаблон условий отмены</p>
          <p className="mt-1 text-sm leading-relaxed text-slate">
            Для просмотра условий отмены{" "}
            <Link href="/organizer/settings" className="font-medium text-brand hover:underline">
              перейдите в настройки организатора
            </Link>
          </p>
        </div>
      </div>

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
