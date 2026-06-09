"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Eye, GripVertical, ImageIcon, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OrganizerRichTextField from "@/components/organizer/OrganizerRichTextField";
import {
  ORGANIZER_TOUR_IMPRESSION_DESCRIPTION_MAX,
  ORGANIZER_TOUR_IMPRESSION_EXTENDED_SCHEDULE_MAX,
  ORGANIZER_TOUR_IMPRESSION_TITLE_MAX,
  ORGANIZER_TOUR_IMPRESSIONS_MAX,
  createEmptyImpression,
} from "@/data/tour-impressions-defaults";
import { ORGANIZER_TOUR_PHOTO_MAX_BYTES } from "@/data/tour-photos-defaults";
import { readFileAsDataUrl } from "@/lib/read-file-as-data-url";
import { cn } from "@/lib/cn";
import type { TourPlace } from "@/types";

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-sm leading-relaxed text-charcoal">
      {children}
    </div>
  );
}

function formatImpressionCount(count: number): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${count} впечатлений`;
  if (mod10 === 1) return `${count} впечатление`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} впечатления`;
  return `${count} впечатлений`;
}

function ImpressionPhotoUpload({
  inputId,
  image,
  onChange,
}: {
  inputId: string;
  image: string;
  onChange: (image: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) throw new Error("Выберите файл изображения");
    if (file.size > ORGANIZER_TOUR_PHOTO_MAX_BYTES) {
      throw new Error("Фото должно быть не больше 5 МБ");
    }
    return readFileAsDataUrl(file);
  }

  function normalizeUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) throw new Error("Вставьте ссылку на фото");
    if (!/^https?:\/\//i.test(trimmed)) {
      throw new Error("Ссылка должна начинаться с http:// или https://");
    }
    return trimmed;
  }

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      onChange(await uploadFile(file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  }

  async function handleUrl() {
    setUploading(true);
    setError(null);
    try {
      onChange(normalizeUrl(urlInput));
      setUrlInput("");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="mx-auto w-full max-w-[140px] shrink-0 sm:mx-0">
        {image ? (
          <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
            <Image src={image} alt="" fill className="object-cover" sizes="140px" unoptimized />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate shadow-sm hover:text-charcoal"
              aria-label="Удалить фото"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white px-2 text-center">
            <ImageIcon className="h-6 w-6 text-gray-300" aria-hidden />
            <p className="mt-1 text-[10px] text-slate">Нет фото</p>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-semibold text-charcoal">Фото впечатления</p>
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky/25 bg-sky/10 px-3 py-2 text-xs font-semibold text-sky hover:bg-sky/15 disabled:opacity-50 sm:w-auto"
        >
          <Camera className="h-3.5 w-3.5" />
          С устройства
        </button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder="Ссылка на фото"
            disabled={uploading}
            className="h-9 text-sm"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleUrl();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            disabled={uploading || !urlInput.trim()}
            onClick={() => void handleUrl()}
            className="shrink-0 sm:min-w-[108px]"
          >
            Загрузить
          </Button>
        </div>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}

function ImpressionCard({
  index,
  impression,
  canReorder,
  dragIndex,
  overIndex,
  onChange,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  index: number;
  impression: TourPlace;
  canReorder: boolean;
  dragIndex: number | null;
  overIndex: number | null;
  onChange: (next: TourPlace) => void;
  onRemove: () => void;
  onDragStart: (index: number, event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onDragOver: (index: number, event: React.DragEvent<HTMLElement>) => void;
  onDrop: (index: number, event: React.DragEvent<HTMLElement>) => void;
}) {
  const previewTitle = impression.title.trim() || `Новое впечатление ${index + 1}`;

  return (
    <article
      data-impression-row
      onDragOver={(event) => onDragOver(index, event)}
      onDrop={(event) => onDrop(index, event)}
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-200/80 bg-gray-50/50 transition-[box-shadow,opacity] duration-150",
        dragIndex === index && "opacity-50",
        overIndex === index && dragIndex !== null && dragIndex !== index && "ring-2 ring-brand/25"
      )}
    >
      <div className="flex items-center gap-2 border-b border-gray-200/70 bg-white px-3 py-2.5 sm:px-4">
        <button
          type="button"
          draggable={canReorder}
          disabled={!canReorder}
          onDragStart={(event) => onDragStart(index, event)}
          onDragEnd={onDragEnd}
          className={cn(
            "inline-flex h-8 w-7 shrink-0 items-center justify-center rounded-lg text-slate transition-colors",
            canReorder
              ? "cursor-grab touch-none active:cursor-grabbing hover:bg-gray-100 hover:text-charcoal"
              : "cursor-default opacity-30"
          )}
          aria-label={`Перетащите впечатление ${index + 1} для изменения порядка`}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>

        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-charcoal">{previewTitle}</p>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-red-600 hover:bg-red-50"
          aria-label={`Удалить впечатление ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-xs font-bold tabular-nums text-brand"
            aria-hidden
          >
            {index + 1}
          </span>
          <span className="text-sm font-bold text-charcoal">Впечатление</span>
        </div>

        <div>
          <label
            htmlFor={`impression-title-${impression.id}`}
            className="mb-1.5 block text-xs font-medium text-charcoal"
          >
            Заголовок
          </label>
          <Input
            id={`impression-title-${impression.id}`}
            value={impression.title}
            maxLength={ORGANIZER_TOUR_IMPRESSION_TITLE_MAX}
            onChange={(event) =>
              onChange({
                ...impression,
                title: event.target.value.slice(0, ORGANIZER_TOUR_IMPRESSION_TITLE_MAX),
              })
            }
            placeholder="Панорамный вид на водопады"
          />
          <p className="mt-1 text-right text-xs text-slate">
            {impression.title.length} / {ORGANIZER_TOUR_IMPRESSION_TITLE_MAX}
          </p>
        </div>

        <div>
          <label
            htmlFor={`impression-description-${impression.id}`}
            className="mb-1.5 block text-xs font-medium text-charcoal"
          >
            Краткое описание
          </label>
          <textarea
            id={`impression-description-${impression.id}`}
            value={impression.description}
            rows={3}
            maxLength={ORGANIZER_TOUR_IMPRESSION_DESCRIPTION_MAX}
            onChange={(event) =>
              onChange({
                ...impression,
                description: event.target.value.slice(0, ORGANIZER_TOUR_IMPRESSION_DESCRIPTION_MAX),
              })
            }
            placeholder="Короткий текст для карточки на странице тура"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-charcoal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <p className="mt-1 text-right text-xs text-slate">
            {impression.description.length} / {ORGANIZER_TOUR_IMPRESSION_DESCRIPTION_MAX}
          </p>
        </div>

        <ImpressionPhotoUpload
          inputId={`impression-photo-${impression.id}`}
          image={impression.image}
          onChange={(image) => onChange({ ...impression, image })}
        />

        <div className="space-y-3 border-t border-gray-200/80 pt-4">
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(impression.extendedScheduleEnabled)}
            onClick={() =>
              onChange({
                ...impression,
                extendedScheduleEnabled: !impression.extendedScheduleEnabled,
              })
            }
            className="flex w-full items-center gap-3 text-left"
          >
            <span
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 overflow-hidden rounded-full p-0.5 transition-colors duration-200",
                impression.extendedScheduleEnabled ? "bg-brand" : "bg-gray-300"
              )}
            >
              <span
                className={cn(
                  "block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
                  impression.extendedScheduleEnabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-charcoal">Расширенное расписание</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate">
                Подробно опишите, когда и как это впечатление происходит в программе тура
              </span>
            </span>
          </button>

          {impression.extendedScheduleEnabled ? (
            <OrganizerRichTextField
              id={`impression-schedule-${impression.id}`}
              value={impression.extendedSchedule ?? ""}
              onChange={(extendedSchedule) => onChange({ ...impression, extendedSchedule })}
              maxLength={ORGANIZER_TOUR_IMPRESSION_EXTENDED_SCHEDULE_MAX}
              rows={8}
              placeholder="Например: День 1 · утро — трансфер к парку. День 1 · 10:00 — экскурсия к смотровым площадкам."
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

interface TourImpressionsBlockProps {
  places: TourPlace[];
  onChange: (places: TourPlace[]) => void;
  designExampleHref?: string;
}

export default function TourImpressionsBlock({
  places,
  onChange,
  designExampleHref = "/tours/patagonia-glaciers",
}: TourImpressionsBlockProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const canAdd = places.length < ORGANIZER_TOUR_IMPRESSIONS_MAX;
  const canReorder = places.length > 1;

  function updateAt(index: number, next: TourPlace) {
    onChange(places.map((item, itemIndex) => (itemIndex === index ? next : item)));
  }

  function reorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= places.length || to >= places.length) return;
    const next = [...places];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(places.filter((_, itemIndex) => itemIndex !== index));
  }

  function addImpression() {
    if (!canAdd) return;
    onChange([...places, createEmptyImpression()]);
  }

  function handleDragStart(index: number, event: React.DragEvent<HTMLButtonElement>) {
    setDragIndex(index);
    setOverIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragOver(index: number, event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragIndex !== null && index !== dragIndex) {
      setOverIndex(index);
    }
  }

  function handleDrop(index: number, event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    if (dragIndex === null) return;
    reorder(dragIndex, index);
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
            Главные впечатления
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate">
            Кратко опишите уникальные моменты тура. Рекомендуем 3, 6 или 9 впечатлений.
            {canReorder ? " Перетащите карточку за ручку, чтобы изменить порядок." : null}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-slate">
            {formatImpressionCount(places.length)}
          </span>
          <Link
            href={designExampleHref}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            <Eye className="h-4 w-4" />
            Пример
          </Link>
        </div>
      </div>

      <InfoBanner>
        Краткое описание попадает в карточку на странице тура. Расширенное расписание показывается
        под карточкой, если включено.
      </InfoBanner>

      <div className="space-y-3">
        {places.map((impression, index) => (
          <ImpressionCard
            key={impression.id}
            index={index}
            impression={{
              ...impression,
              extendedScheduleEnabled: impression.extendedScheduleEnabled ?? false,
              extendedSchedule: impression.extendedSchedule ?? "",
            }}
            canReorder={canReorder}
            dragIndex={dragIndex}
            overIndex={overIndex}
            onChange={(next) => updateAt(index, next)}
            onRemove={() => removeAt(index)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {canAdd ? (
        <button
          type="button"
          onClick={addImpression}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand/10 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/15"
        >
          <Plus className="h-4 w-4" />
          Добавить впечатление {places.length + 1}
        </button>
      ) : (
        <p className="text-sm text-slate">
          Достигнут лимит — не больше {ORGANIZER_TOUR_IMPRESSIONS_MAX} впечатлений.
        </p>
      )}
    </section>
  );
}
