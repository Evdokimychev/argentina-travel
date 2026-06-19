"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Eye, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ORGANIZER_TOUR_ACCOMMODATION_DESCRIPTION_MAX,
  ORGANIZER_TOUR_ACCOMMODATION_PHOTOS_MAX,
} from "@/data/tour-accommodation-defaults";
import { countDescriptionWords } from "@/data/tour-description-defaults";
import { ORGANIZER_TOUR_PHOTO_MAX_BYTES } from "@/data/tour-photos-defaults";
import { readFileAsDataUrl } from "@/lib/read-file-as-data-url";
import { getPlainTextLength } from "@/lib/rich-text";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { cn } from "@/lib/cn";

function PhotoThumbnail({
  src,
  alt,
  onRemove,
}: {
  src: string;
  alt: string;
  onRemove: () => void;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100">
      <Image src={src} alt={alt} fill className="object-cover" sizes="120px" unoptimized />
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate shadow-sm transition-colors hover:bg-white hover:text-charcoal"
        aria-label="Удалить фото"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface TourAccommodationDescriptionBlockProps {
  description: string;
  photos: string[];
  onDescriptionChange: (next: string) => void;
  onPhotosChange: (photos: string[]) => void;
  variantLabel?: string;
  variantDiff?: string;
  onApplySync?: () => void;
  designExampleHref?: string;
}

export default function TourAccommodationDescriptionBlock({
  description,
  photos,
  onDescriptionChange,
  onPhotosChange,
  variantLabel,
  variantDiff,
  onApplySync,
  designExampleHref = "/tours/patagonia-glaciers#accommodations",
}: TourAccommodationDescriptionBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedDiff, setExpandedDiff] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

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

  async function addPhoto(src: string) {
    if (photos.length >= ORGANIZER_TOUR_ACCOMMODATION_PHOTOS_MAX) {
      setPhotoError(`Можно загрузить не больше ${ORGANIZER_TOUR_ACCOMMODATION_PHOTOS_MAX} фото`);
      return;
    }
    onPhotosChange([...photos, src]);
  }

  async function handleFileSelect(file: File) {
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      await addPhoto(await uploadFile(file));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Не удалось загрузить фото");
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleUrlUpload() {
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      await addPhoto(normalizeUrl(urlInput));
      setUrlInput("");
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Не удалось загрузить фото");
    } finally {
      setPhotoUploading(false);
    }
  }

  const wordCount = countDescriptionWords(description);
  const charCount = getPlainTextLength(description);
  const diffPreviewLength = 140;
  const showDiffExpand = (variantDiff?.length ?? 0) > diffPreviewLength;
  const photosFull = photos.length >= ORGANIZER_TOUR_ACCOMMODATION_PHOTOS_MAX;

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
          Общее описание проживания
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

      <div className="rounded-2xl border border-sky/20 bg-sky/10 px-4 py-3 text-sm leading-relaxed text-charcoal">
        Расскажите туристам, где и в каких условиях они будут жить. Укажите варианты размещения,
        удобства и особенности — и добавьте фотографии, если они есть.
      </div>

      <RichTextEditor
        value={description}
        onChange={onDescriptionChange}
        maxLength={ORGANIZER_TOUR_ACCOMMODATION_DESCRIPTION_MAX}
        placeholder="Опишите условия проживания на туре…"
        minHeight={192}
        footer={
          <p className="text-right text-xs text-slate">
            Слов: {wordCount} · Символов: {charCount} / {ORGANIZER_TOUR_ACCOMMODATION_DESCRIPTION_MAX}
          </p>
        }
      />

      {variantDiff && variantLabel ? (
        <div className="space-y-3">
          {onApplySync ? (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-charcoal">
              <button type="button" onClick={onApplySync} className="text-left">
                <Link2 className="mr-1.5 inline h-4 w-4 align-[-2px] text-brand" />
                Применить изменение во всех вариантах тура?{" "}
                <span className="font-semibold text-brand hover:underline">Применить</span>
              </button>
            </div>
          ) : null}
          <div className="rounded-xl bg-brand-light/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
            <p>
              Отличия в варианте «{variantLabel}»:{" "}
              {expandedDiff || !showDiffExpand
                ? variantDiff
                : `${variantDiff.slice(0, diffPreviewLength)}…`}{" "}
              {showDiffExpand ? (
                <button
                  type="button"
                  onClick={() => setExpandedDiff((prev) => !prev)}
                  className={cn("font-semibold text-brand hover:underline")}
                >
                  {expandedDiff ? "Свернуть" : "Развернуть"}
                </button>
              ) : null}
            </p>
          </div>
        </div>
      ) : null}

      <div className="space-y-4 border-t border-gray-200 pt-6">
        <h3 className="text-base font-bold text-charcoal">Фотографии к описанию</h3>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
          Не используйте чужие фото без разрешения — за нарушение авторских прав возможен штраф.{" "}
          <Link href="/help/photo-copyright" className="font-semibold text-brand hover:underline">
            читать подробнее
          </Link>
        </div>

        <input
          ref={fileInputRef}
          id="tour-accommodation-photo-file"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFileSelect(file);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={photosFull || photoUploading}
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
            disabled={photosFull || photoUploading}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleUrlUpload();
              }
            }}
          />
          <Button
            type="button"
            disabled={photosFull || photoUploading || !urlInput.trim()}
            onClick={() => void handleUrlUpload()}
            className="shrink-0 sm:min-w-[132px]"
          >
            <Camera className="h-4 w-4" />
            Загрузить
          </Button>
        </div>

        {photoError ? <p className="text-sm text-red-600">{photoError}</p> : null}

        {photos.length ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {photos.map((photo, index) => (
              <PhotoThumbnail
                key={`${photo}-${index}`}
                src={photo}
                alt={`Фото проживания ${index + 1}`}
                onRemove={() => onPhotosChange(photos.filter((_, itemIndex) => itemIndex !== index))}
              />
            ))}
          </div>
        ) : null}

        <p className="text-sm text-slate">
          Загрузили {photos.length} из {ORGANIZER_TOUR_ACCOMMODATION_PHOTOS_MAX} фото
        </p>
      </div>
    </section>
  );
}
