"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Eye, ImageIcon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ORGANIZER_TOUR_GALLERY_MAX,
  ORGANIZER_TOUR_GALLERY_MIN,
  ORGANIZER_TOUR_PHOTO_MAX_BYTES,
} from "@/data/tour-photos-defaults";
import { readFileAsDataUrl } from "@/lib/read-file-as-data-url";
import { cn } from "@/lib/cn";

function PhotoInfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-sm leading-relaxed text-charcoal">
      {children}
    </div>
  );
}

function formatPhotoCount(count: number): string {
  return `${count} фото`;
}

function PhotoThumbnail({
  src,
  alt,
  onRemove,
  size = "md",
}: {
  src: string;
  alt: string;
  onRemove: () => void;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl bg-gray-100",
        size === "lg" && "aspect-[4/3] w-full",
        size === "md" && "aspect-square",
        size === "sm" && "aspect-square"
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={size === "lg" ? "280px" : "120px"}
        unoptimized
      />
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

function PhotoUploadControls({
  inputId,
  urlValue,
  onUrlChange,
  onUploadUrl,
  onUploadFile,
  uploading,
  disabled,
  error,
  compact,
}: {
  inputId: string;
  urlValue: string;
  onUrlChange: (value: string) => void;
  onUploadUrl: () => void;
  onUploadFile: (file: File) => void;
  uploading?: boolean;
  disabled?: boolean;
  error?: string | null;
  compact?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("space-y-2", compact && "space-y-2.5")}>
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUploadFile(file);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl border border-sky/25 bg-sky/10 font-semibold text-sky transition-colors hover:bg-sky/15 disabled:cursor-not-allowed disabled:opacity-50",
          compact
            ? "w-full px-3 py-2 text-xs sm:w-auto"
            : "w-full px-4 py-3 text-sm"
        )}
      >
        <Camera className={cn("shrink-0", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        {compact ? "С устройства" : "Загрузить фото с устройства"}
      </button>

      <div className={cn("flex gap-2", compact ? "flex-col sm:flex-row" : "flex-col sm:flex-row")}>
        <Input
          value={urlValue}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="Ссылка на фото"
          disabled={disabled || uploading}
          className={compact ? "h-9 text-sm" : undefined}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onUploadUrl();
            }
          }}
        />
        <Button
          type="button"
          size={compact ? "sm" : "default"}
          disabled={disabled || uploading || !urlValue.trim()}
          onClick={onUploadUrl}
          className={cn("shrink-0", compact ? "sm:min-w-[108px]" : "sm:min-w-[132px]")}
        >
          Загрузить
        </Button>
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

interface TourPhotosBlockProps {
  coverImage: string;
  gallery: string[];
  onCoverChange: (image: string) => void;
  onGalleryChange: (gallery: string[]) => void;
  designExampleHref?: string;
}

export default function TourPhotosBlock({
  coverImage,
  gallery,
  onCoverChange,
  onGalleryChange,
  designExampleHref = "/tours/iguazu-falls",
}: TourPhotosBlockProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [coverUrlInput, setCoverUrlInput] = useState("");
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const [coverError, setCoverError] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  async function uploadImageFile(file: File): Promise<string> {
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

  async function handleCoverFile(file: File) {
    setCoverUploading(true);
    setCoverError(null);

    try {
      onCoverChange(await uploadImageFile(file));
    } catch (error) {
      setCoverError(error instanceof Error ? error.message : "Не удалось загрузить фото");
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleCoverUrl() {
    setCoverUploading(true);
    setCoverError(null);

    try {
      onCoverChange(normalizeUrl(coverUrlInput));
      setCoverUrlInput("");
    } catch (error) {
      setCoverError(error instanceof Error ? error.message : "Не удалось загрузить фото");
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleGalleryFile(file: File) {
    if (gallery.length >= ORGANIZER_TOUR_GALLERY_MAX) {
      setGalleryError(`Можно загрузить не больше ${ORGANIZER_TOUR_GALLERY_MAX} фото`);
      return;
    }

    setGalleryUploading(true);
    setGalleryError(null);

    try {
      onGalleryChange([...gallery, await uploadImageFile(file)]);
    } catch (error) {
      setGalleryError(error instanceof Error ? error.message : "Не удалось загрузить фото");
    } finally {
      setGalleryUploading(false);
    }
  }

  async function handleGalleryUrl() {
    if (gallery.length >= ORGANIZER_TOUR_GALLERY_MAX) {
      setGalleryError(`Можно загрузить не больше ${ORGANIZER_TOUR_GALLERY_MAX} фото`);
      return;
    }

    setGalleryUploading(true);
    setGalleryError(null);

    try {
      onGalleryChange([...gallery, normalizeUrl(galleryUrlInput)]);
      setGalleryUrlInput("");
    } catch (error) {
      setGalleryError(error instanceof Error ? error.message : "Не удалось загрузить фото");
    } finally {
      setGalleryUploading(false);
    }
  }

  const galleryFull = gallery.length >= ORGANIZER_TOUR_GALLERY_MAX;
  const galleryNeedsMore = gallery.length < ORGANIZER_TOUR_GALLERY_MIN;

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
          Загрузите фотографии
        </h2>
        <p className="mt-1 text-sm text-slate">
          Обложка — одно главное фото для каталога. Галерея — от {ORGANIZER_TOUR_GALLERY_MIN} до{" "}
          {ORGANIZER_TOUR_GALLERY_MAX} снимков на странице тура.
        </p>
      </div>

      <PhotoInfoBanner>
        Используйте качественные оригинальные фото — за нарушение авторских прав возможен штраф.{" "}
        <Link href="/help/photo-copyright" className="font-semibold text-brand hover:underline">
          читать подробнее
        </Link>
      </PhotoInfoBanner>

      <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
          <div className="mx-auto w-full max-w-[280px] shrink-0 lg:mx-0">
            {coverImage ? (
              <PhotoThumbnail
                src={coverImage}
                alt="Фотография обложки"
                size="lg"
                onRemove={() => onCoverChange("")}
              />
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 text-center">
                <ImageIcon className="h-8 w-8 text-gray-300" aria-hidden />
                <p className="mt-2 text-xs text-slate">Пока нет обложки</p>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h3 className="text-base font-bold text-charcoal">Фотография обложки</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate">
                Одно фото — отображается в карточке тура в каталоге и в шапке страницы.
              </p>
            </div>

            <PhotoUploadControls
              inputId="tour-cover-file"
              urlValue={coverUrlInput}
              onUrlChange={setCoverUrlInput}
              onUploadUrl={handleCoverUrl}
              onUploadFile={handleCoverFile}
              uploading={coverUploading}
              error={coverError}
              compact
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-charcoal sm:text-lg">Фотографии тура</h3>
            <p className="mt-1 text-sm text-slate">
              Лучшие снимки разместите в начале — они показываются первыми на странице тура.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-slate">
              {formatPhotoCount(gallery.length)} / {ORGANIZER_TOUR_GALLERY_MAX}
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

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <PhotoUploadControls
              inputId="tour-gallery-file"
              urlValue={galleryUrlInput}
              onUrlChange={setGalleryUrlInput}
              onUploadUrl={handleGalleryUrl}
              onUploadFile={handleGalleryFile}
              uploading={galleryUploading}
              disabled={galleryFull}
              error={galleryError}
              compact
            />
          </div>
        </div>

        <p
          className={cn(
            "text-sm",
            galleryNeedsMore ? "font-medium text-amber-700" : "text-slate"
          )}
        >
          {galleryNeedsMore
            ? `Загрузили ${gallery.length} из ${ORGANIZER_TOUR_GALLERY_MAX} · нужно ещё минимум ${ORGANIZER_TOUR_GALLERY_MIN - gallery.length}`
            : `Загружено ${gallery.length} из ${ORGANIZER_TOUR_GALLERY_MAX} фото`}
        </p>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {gallery.map((photo, index) => (
            <PhotoThumbnail
              key={`${photo}-${index}`}
              src={photo}
              alt={`Фото тура ${index + 1}`}
              size="sm"
              onRemove={() => onGalleryChange(gallery.filter((_, itemIndex) => itemIndex !== index))}
            />
          ))}

          {!galleryFull ? (
            <>
              <input
                ref={galleryInputRef}
                id="tour-gallery-file-quick"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleGalleryFile(file);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={galleryUploading}
                onClick={() => galleryInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/80 text-slate transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand disabled:opacity-50"
                aria-label="Добавить фото в галерею"
              >
                <Plus className="h-5 w-5" />
                <span className="text-[10px] font-medium">Добавить</span>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
