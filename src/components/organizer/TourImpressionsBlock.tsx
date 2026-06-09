"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp, Camera, Eye, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ORGANIZER_TOUR_IMPRESSION_DESCRIPTION_MAX,
  ORGANIZER_TOUR_IMPRESSION_TITLE_MAX,
  ORGANIZER_TOUR_IMPRESSIONS_MAX,
  createEmptyImpression,
} from "@/data/tour-impressions-defaults";
import { ORGANIZER_TOUR_PHOTO_MAX_BYTES } from "@/data/tour-photos-defaults";
import { readFileAsDataUrl } from "@/lib/read-file-as-data-url";
import type { TourPlace } from "@/types";

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
      {children}
    </div>
  );
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
    if (!file.type.startsWith("image/")) {
      throw new Error("Выберите файл изображения");
    }
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
    <div className="space-y-3">
      <p className="text-sm font-medium text-charcoal">Загрузите фотографию впечатления</p>

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
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky/25 bg-sky/10 px-4 py-3.5 text-sm font-semibold text-sky transition-colors hover:bg-sky/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Camera className="h-4 w-4" />
        Загрузить фото с устройства
      </button>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          placeholder="Или вставьте ссылку на фото"
          disabled={uploading}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleUrl();
            }
          }}
        />
        <Button
          type="button"
          disabled={uploading || !urlInput.trim()}
          onClick={() => void handleUrl()}
          className="shrink-0 sm:min-w-[132px]"
        >
          <Camera className="h-4 w-4" />
          Загрузить
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {image ? (
        <div className="relative aspect-square w-28 overflow-hidden rounded-xl bg-gray-100">
          <Image src={image} alt="" fill className="object-cover" sizes="112px" unoptimized />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate shadow-sm transition-colors hover:bg-white hover:text-charcoal"
            aria-label="Удалить фото"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ImpressionCard({
  index,
  impression,
  total,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  index: number;
  impression: TourPlace;
  total: number;
  onChange: (next: TourPlace) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <p className="text-sm font-bold text-charcoal">
        {index + 1} Впечатление
      </p>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-charcoal">Заголовок</label>
        <Input
          value={impression.title}
          maxLength={ORGANIZER_TOUR_IMPRESSION_TITLE_MAX}
          onChange={(event) =>
            onChange({
              ...impression,
              title: event.target.value.slice(0, ORGANIZER_TOUR_IMPRESSION_TITLE_MAX),
            })
          }
        />
        <p className="mt-1 text-right text-xs text-slate">
          {impression.title.length} / {ORGANIZER_TOUR_IMPRESSION_TITLE_MAX}
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-charcoal">Описание</label>
        <textarea
          value={impression.description}
          rows={4}
          maxLength={ORGANIZER_TOUR_IMPRESSION_DESCRIPTION_MAX}
          onChange={(event) =>
            onChange({
              ...impression,
              description: event.target.value.slice(0, ORGANIZER_TOUR_IMPRESSION_DESCRIPTION_MAX),
            })
          }
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm leading-relaxed text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
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

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
        <span className="text-xs text-slate">Изменить порядок</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-medium text-charcoal transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Вверх
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-medium text-charcoal transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            Вниз
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Удалить
          </button>
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
  function updateAt(index: number, next: TourPlace) {
    onChange(places.map((item, itemIndex) => (itemIndex === index ? next : item)));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= places.length) return;
    const next = [...places];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(places.filter((_, itemIndex) => itemIndex !== index));
  }

  function addImpression() {
    if (places.length >= ORGANIZER_TOUR_IMPRESSIONS_MAX) return;
    onChange([...places, createEmptyImpression()]);
  }

  const canAdd = places.length < ORGANIZER_TOUR_IMPRESSIONS_MAX;

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
          Главные впечатления
        </h2>
        <Link
          href={designExampleHref}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
        >
          <Eye className="h-4 w-4" />
          Пример оформления
        </Link>
      </div>

      <InfoBanner>
        Кратко опишите уникальные моменты тура — то, что запомнится туристам больше всего.
        Рекомендуем добавить 3, 6 или 9 впечатлений (кратность трём, не больше{" "}
        {ORGANIZER_TOUR_IMPRESSIONS_MAX}).
      </InfoBanner>

      <div className="space-y-4">
        {places.map((impression, index) => (
          <ImpressionCard
            key={impression.id}
            index={index}
            impression={impression}
            total={places.length}
            onChange={(next) => updateAt(index, next)}
            onMoveUp={() => moveItem(index, -1)}
            onMoveDown={() => moveItem(index, 1)}
            onRemove={() => removeAt(index)}
          />
        ))}
      </div>

      {canAdd ? (
        <button
          type="button"
          onClick={addImpression}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Добавить впечатление
        </button>
      ) : (
        <p className="text-sm text-slate">
          Достигнут лимит — не больше {ORGANIZER_TOUR_IMPRESSIONS_MAX} впечатлений.
        </p>
      )}
    </section>
  );
}
