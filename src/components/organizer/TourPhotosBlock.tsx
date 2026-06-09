"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Eye, X } from "lucide-react";
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
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
      {children}
    </div>
  );
}

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

function PhotoUploadControls({
  inputId,
  urlValue,
  onUrlChange,
  onUploadUrl,
  onUploadFile,
  uploading,
  disabled,
  error,
}: {
  inputId: string;
  urlValue: string;
  onUrlChange: (value: string) => void;
  onUploadUrl: () => void;
  onUploadFile: (file: File) => void;
  uploading?: boolean;
  disabled?: boolean;
  error?: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
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
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky/25 bg-sky/10 px-4 py-3.5 text-sm font-semibold text-sky transition-colors hover:bg-sky/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Camera className="h-4 w-4" />
        Загрузить фото с устройства
      </button>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={urlValue}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="Или вставьте ссылку на фото"
          disabled={disabled || uploading}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onUploadUrl();
            }
          }}
        />
        <Button
          type="button"
          disabled={disabled || uploading || !urlValue.trim()}
          onClick={onUploadUrl}
          className="shrink-0 sm:min-w-[132px]"
        >
          <Camera className="h-4 w-4" />
          Загрузить
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
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
      const dataUrl = await uploadImageFile(file);
      onCoverChange(dataUrl);
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
      const dataUrl = await uploadImageFile(file);
      onGalleryChange([...gallery, dataUrl]);
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

  return (
    <section className="space-y-8 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
        Загрузите фотографии
      </h2>

      <div className="space-y-4">
        <h3 className="text-base font-bold text-charcoal">Фотография обложки</h3>

        <PhotoInfoBanner>
          Используйте качественные оригинальные фото — за нарушение авторских прав возможен штраф.{" "}
          <Link href="/help/photo-copyright" className="font-semibold text-brand hover:underline">
            читать подробнее
          </Link>
        </PhotoInfoBanner>

        <PhotoUploadControls
          inputId="tour-cover-file"
          urlValue={coverUrlInput}
          onUrlChange={setCoverUrlInput}
          onUploadUrl={handleCoverUrl}
          onUploadFile={handleCoverFile}
          uploading={coverUploading}
          error={coverError}
        />

        {coverImage ? (
          <div className="grid grid-cols-3 gap-3 sm:max-w-xs">
            <PhotoThumbnail
              src={coverImage}
              alt="Фотография обложки"
              onRemove={() => onCoverChange("")}
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-4 border-t border-gray-200 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-charcoal">Фотографии тура</h3>
          <Link
            href={designExampleHref}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            <Eye className="h-4 w-4" />
            Пример оформления
          </Link>
        </div>

        <PhotoInfoBanner>
          Загрузите от {ORGANIZER_TOUR_GALLERY_MIN} до {ORGANIZER_TOUR_GALLERY_MAX} качественных
          фото. Лучшие снимки разместите в начале галереи. Используйте оригинальные фото — за
          нарушение авторских прав возможен штраф.{" "}
          <Link href="/help/photo-copyright" className="font-semibold text-brand hover:underline">
            читать подробнее
          </Link>
        </PhotoInfoBanner>

        <PhotoUploadControls
          inputId="tour-gallery-file"
          urlValue={galleryUrlInput}
          onUrlChange={setGalleryUrlInput}
          onUploadUrl={handleGalleryUrl}
          onUploadFile={handleGalleryFile}
          uploading={galleryUploading}
          disabled={galleryFull}
          error={galleryError}
        />

        <p
          className={cn(
            "text-sm",
            gallery.length < ORGANIZER_TOUR_GALLERY_MIN ? "text-amber-700" : "text-slate"
          )}
        >
          Загрузили {gallery.length} из {ORGANIZER_TOUR_GALLERY_MAX} фото
          {gallery.length < ORGANIZER_TOUR_GALLERY_MIN
            ? ` · нужно ещё минимум ${ORGANIZER_TOUR_GALLERY_MIN - gallery.length}`
            : null}
        </p>

        {gallery.length ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {gallery.map((photo, index) => (
              <PhotoThumbnail
                key={`${photo}-${index}`}
                src={photo}
                alt={`Фото тура ${index + 1}`}
                onRemove={() => onGalleryChange(gallery.filter((_, itemIndex) => itemIndex !== index))}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
