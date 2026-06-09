"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ORGANIZER_TOUR_PHOTO_MAX_BYTES } from "@/data/tour-photos-defaults";
import { readFileAsDataUrl } from "@/lib/read-file-as-data-url";

interface OrganizerPhotoUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  inputId: string;
  maxPhotos: number;
  label?: string;
  disabled?: boolean;
}

export default function OrganizerPhotoUpload({
  images,
  onChange,
  inputId,
  maxPhotos,
  label = "Добавьте фотографии",
  disabled,
}: OrganizerPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const canAdd = images.length < maxPhotos;

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

  async function addImage(src: string) {
    if (!canAdd) return;
    onChange([...images, src]);
  }

  async function handleFileSelect(file: File) {
    setError(null);
    setUploading(true);
    try {
      await addImage(await uploadFile(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  }

  async function handleUrlUpload() {
    setError(null);
    setUploading(true);
    try {
      await addImage(normalizeUrl(urlInput));
      setUrlInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-charcoal">{label}</p>

      {images.length ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((src, index) => (
            <div key={`${src}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
              <Image src={src} alt="" fill className="object-cover" sizes="120px" unoptimized />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate shadow-sm hover:text-charcoal"
                aria-label="Удалить фото"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        id={inputId}
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
        disabled={disabled || uploading || !canAdd}
        onClick={() => fileInputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky/25 bg-sky/10 px-4 py-3 text-sm font-semibold text-sky transition-colors hover:bg-sky/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Camera className="h-4 w-4" />
        Загрузить фото с устройства
      </button>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          placeholder="Или вставьте ссылку на фото"
          disabled={disabled || uploading || !canAdd}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleUrlUpload();
            }
          }}
        />
        <Button
          type="button"
          disabled={disabled || uploading || !canAdd || !urlInput.trim()}
          onClick={() => void handleUrlUpload()}
          className="shrink-0 sm:min-w-[132px]"
        >
          Загрузить
        </Button>
      </div>

      {error ? <p className="text-xs text-brand">{error}</p> : null}
    </div>
  );
}
