"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { Camera, Loader2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  TOURIST_REVIEW_PHOTOS_MAX,
  uploadReviewPhoto,
} from "@/lib/review-photos";

type UploadProgress = {
  id: string;
  name: string;
  percent: number;
};

type ReviewPhotoUploadProps = {
  userId: string;
  photos: string[];
  onChange: (photos: string[]) => void;
  disabled?: boolean;
  className?: string;
};

export default function ReviewPhotoUpload({
  userId,
  photos,
  onChange,
  disabled,
  className,
}: ReviewPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const canAdd = photos.length < TOURIST_REVIEW_PHOTOS_MAX;
  const isUploading = uploads.some((item) => item.percent < 100);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!canAdd || disabled) return;
      setError(null);

      const remaining = TOURIST_REVIEW_PHOTOS_MAX - photos.length;
      const batch = Array.from(files)
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, remaining);

      if (!batch.length) {
        setError("Выберите файлы изображений");
        return;
      }

      let supabase;
      try {
        supabase = createSupabaseBrowserClient();
      } catch {
        setError("Загрузка фото недоступна — проверьте настройки Supabase");
        return;
      }

      const nextPhotos = [...photos];

      for (const file of batch) {
        const uploadId = crypto.randomUUID();
        setUploads((current) => [...current, { id: uploadId, name: file.name, percent: 0 }]);

        const result = await uploadReviewPhoto(supabase, userId, file, (percent) => {
          setUploads((current) =>
            current.map((item) => (item.id === uploadId ? { ...item, percent } : item))
          );
        });

        setUploads((current) => current.filter((item) => item.id !== uploadId));

        if ("error" in result) {
          setError(result.error);
          continue;
        }

        nextPhotos.push(result.url);
      }

      onChange(nextPhotos.slice(0, TOURIST_REVIEW_PHOTOS_MAX));
    },
    [canAdd, disabled, onChange, photos, userId]
  );

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files.length) {
      void uploadFiles(event.dataTransfer.files);
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-charcoal">Фотографии поездки</p>
        <span className="text-xs text-slate">
          {photos.length}/{TOURIST_REVIEW_PHOTOS_MAX}
        </span>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((src) => (
            <div key={src} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
              <Image src={src} alt="" fill className="object-cover" sizes="120px" unoptimized />
              <button
                type="button"
                disabled={disabled || isUploading}
                onClick={() => onChange(photos.filter((item) => item !== src))}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate shadow-sm hover:text-charcoal disabled:opacity-50"
                aria-label="Удалить фото"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {uploads.length > 0 ? (
        <ul className="space-y-2">
          {uploads.map((item) => (
            <li key={item.id} className="rounded-xl border border-gray-200 bg-white px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-slate">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                <span className="min-w-0 truncate">{item.name}</span>
                <span className="ml-auto shrink-0">{item.percent}%</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-sky transition-all"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={disabled || !canAdd || isUploading}
        onChange={(event) => {
          if (event.target.files?.length) void uploadFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div
        role="button"
        tabIndex={disabled || !canAdd || isUploading ? -1 : 0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && canAdd) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && canAdd && !isUploading) inputRef.current?.click();
        }}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-colors",
          dragOver ? "border-sky bg-sky/10" : "border-sky/25 bg-sky/5 hover:bg-sky/10",
          (disabled || !canAdd || isUploading) && "cursor-not-allowed opacity-50"
        )}
      >
        <Camera className="h-5 w-5 text-sky" aria-hidden />
        <p className="text-sm font-semibold text-sky">
          {canAdd ? "Перетащите фото сюда или выберите файлы" : "Достигнут лимит фото"}
        </p>
        <p className="text-xs text-slate">До 5 фото, каждое не больше 5 МБ</p>
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
