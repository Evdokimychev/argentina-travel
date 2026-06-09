"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ORGANIZER_TOUR_PROGRAM_DAY_DESCRIPTION_MAX,
  ORGANIZER_TOUR_PROGRAM_DAY_PHOTOS_MAX,
  type OrganizerProgramDay,
} from "@/data/tour-program-defaults";
import OrganizerPhotoUpload from "@/components/organizer/OrganizerPhotoUpload";
import OrganizerRichTextField from "@/components/organizer/OrganizerRichTextField";

interface TourProgramDayEditorProps {
  day: OrganizerProgramDay;
  index: number;
  total: number;
  onChange: (day: OrganizerProgramDay) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddAfter: () => void;
  canAddDay: boolean;
}

export default function TourProgramDayEditor({
  day,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddAfter,
  canAddDay,
}: TourProgramDayEditorProps) {
  return (
    <article className="space-y-5 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-lg font-bold text-brand">
          {day.dayNumber}
        </span>
        <span className="text-base font-bold text-charcoal">День</span>
      </div>

      <div className="relative">
        <label
          htmlFor={`program-day-title-${day.id}`}
          className="pointer-events-none absolute left-3 top-0 z-10 -translate-y-1/2 bg-white px-1 text-xs font-medium text-slate"
        >
          Заголовок дня*
        </label>
        <Input
          id={`program-day-title-${day.id}`}
          value={day.title}
          onChange={(event) => onChange({ ...day, title: event.target.value })}
          placeholder="Прибытие и знакомство с регионом"
          className="h-14 pt-1"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-charcoal">Описание дня</p>
        <OrganizerRichTextField
          id={`program-day-description-${day.id}`}
          value={day.description}
          onChange={(description) => onChange({ ...day, description })}
          maxLength={ORGANIZER_TOUR_PROGRAM_DAY_DESCRIPTION_MAX}
          placeholder="Утро — День: • Трансфер из аэропорта"
        />
      </div>

      <OrganizerPhotoUpload
        inputId={`program-day-photos-${day.id}`}
        images={day.images}
        onChange={(images) => onChange({ ...day, images })}
        maxPhotos={ORGANIZER_TOUR_PROGRAM_DAY_PHOTOS_MAX}
      />

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onAddAfter}
          disabled={!canAddDay}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand/10 px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Добавить день
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate">Изменить порядок</span>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-charcoal disabled:opacity-40"
            aria-label="Переместить день выше"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-charcoal disabled:opacity-40"
            aria-label="Переместить день ниже"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={total <= 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-red-600 disabled:opacity-40"
            aria-label="Удалить день"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
