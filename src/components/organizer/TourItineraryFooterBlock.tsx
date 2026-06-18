"use client";

import { DifficultyDotRating } from "@/components/marketplace/sidebar-filter-ui";
import { TOUR_ITINERARY_ORGANIZER_COMMENT_MAX } from "@/data/tour-organizer-display-defaults";
import { DIFFICULTY_DOT_COUNT } from "@/data/tour-levels";
import type { DifficultyLevel } from "@/types";

interface TourItineraryFooterBlockProps {
  difficultyLevel: DifficultyLevel;
  itineraryOrganizerCommentText: string;
  onCommentChange: (text: string) => void;
  onOpenMainTab?: () => void;
}

export default function TourItineraryFooterBlock({
  difficultyLevel,
  itineraryOrganizerCommentText,
  onCommentChange,
  onOpenMainTab,
}: TourItineraryFooterBlockProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
          Сложность и комментарий в конце программы
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate">
          Блок показывается под списком дней на странице тура. Уровень сложности и подробное
          описание задаются во вкладке «Основное».
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate">Текущий уровень</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-sm font-semibold text-charcoal">{difficultyLevel}</span>
          <DifficultyDotRating filled={DIFFICULTY_DOT_COUNT[difficultyLevel]} />
        </div>
        {onOpenMainTab ? (
          <button
            type="button"
            onClick={onOpenMainTab}
            className="mt-2 text-sm font-medium text-sky transition-colors hover:text-sky-dark"
          >
            Изменить сложность во вкладке «Основное» →
          </button>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="tour-itinerary-organizer-comment"
          className="block text-sm font-semibold text-charcoal"
        >
          Комментарий организатора
        </label>
        <p className="mt-1 text-sm text-slate">
          Кратко поясните особенности маршрута, темп и нагрузку — туристы увидят это после всех
          дней программы.
        </p>
        <textarea
          id="tour-itinerary-organizer-comment"
          value={itineraryOrganizerCommentText}
          maxLength={TOUR_ITINERARY_ORGANIZER_COMMENT_MAX}
          rows={6}
          onChange={(event) =>
            onCommentChange(event.target.value.slice(0, TOUR_ITINERARY_ORGANIZER_COMMENT_MAX))
          }
          placeholder="Маршрут рассчитан на туристов со средней физической формой. Большую часть пути проезжаем на минивэне, но виды за окном не дадут заскучать."
          className="mt-3 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-charcoal placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <p className="mt-1 text-right text-xs text-slate">
          {itineraryOrganizerCommentText.length} / {TOUR_ITINERARY_ORGANIZER_COMMENT_MAX}
        </p>
      </div>
    </section>
  );
}
