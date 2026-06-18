"use client";

import { ComfortDotRating } from "@/components/marketplace/sidebar-filter-ui";
import { TOUR_ACCOMMODATION_ORGANIZER_COMMENT_MAX } from "@/data/tour-organizer-display-defaults";
import { COMFORT_DOT_COUNT, primaryComfortLevel } from "@/data/tour-levels";
import type { ComfortLevel } from "@/types";

interface TourAccommodationFooterBlockProps {
  comfortLevels: ComfortLevel[];
  accommodationOrganizerCommentText: string;
  onCommentChange: (text: string) => void;
  onOpenComfortTab?: () => void;
}

export default function TourAccommodationFooterBlock({
  comfortLevels,
  accommodationOrganizerCommentText,
  onCommentChange,
  onOpenComfortTab,
}: TourAccommodationFooterBlockProps) {
  const primaryLevel = primaryComfortLevel(comfortLevels);

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
          Комфорт и комментарий в конце блока «Проживание»
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate">
          Блок показывается под карточками жилья на странице тура. Уровень комфорта задаётся выше,
          подробное описание — в «Общем описании проживания».
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate">Основной уровень</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-sm font-semibold text-charcoal">{primaryLevel}</span>
          <ComfortDotRating filled={COMFORT_DOT_COUNT[primaryLevel]} />
        </div>
        {onOpenComfortTab ? (
          <button
            type="button"
            onClick={onOpenComfortTab}
            className="mt-2 text-sm font-medium text-sky transition-colors hover:text-sky-dark"
          >
            Изменить уровень комфорта выше →
          </button>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="tour-accommodation-organizer-comment"
          className="block text-sm font-semibold text-charcoal"
        >
          Комментарий организатора
        </label>
        <p className="mt-1 text-sm text-slate">
          Поясните особенности размещения, переезды между отелями, что взять с собой в номер — туристы
          увидят это в раскрывающемся блоке после списка жилья.
        </p>
        <textarea
          id="tour-accommodation-organizer-comment"
          value={accommodationOrganizerCommentText}
          maxLength={TOUR_ACCOMMODATION_ORGANIZER_COMMENT_MAX}
          rows={6}
          onChange={(event) =>
            onCommentChange(
              event.target.value.slice(0, TOUR_ACCOMMODATION_ORGANIZER_COMMENT_MAX)
            )
          }
          placeholder="Отели 4* с завтраками, в lodge Wi-Fi может быть слабым. Между городами — перелёты и трансферы включены, багаж перевозим мы."
          className="mt-3 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-charcoal placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <p className="mt-1 text-right text-xs text-slate">
          {accommodationOrganizerCommentText.length} / {TOUR_ACCOMMODATION_ORGANIZER_COMMENT_MAX}
        </p>
      </div>
    </section>
  );
}
