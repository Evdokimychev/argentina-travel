"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { uploadOrganizerProductImage } from "@/lib/organizer-product-media-client";

interface OrganizerPhotoUploadProps {
  productId: string;
  images: string[];
  onChange: (images: string[]) => void;
  inputId: string;
  maxPhotos: number;
  label?: string;
  disabled?: boolean;
}

export default function OrganizerPhotoUpload({
  productId,
  images,
  onChange,
  inputId,
  maxPhotos,
  label = "Добавьте фотографии",
  disabled,
}: OrganizerPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const canAdd = images.length < maxPhotos;

  async function uploadFile(file: File) {
    return uploadOrganizerProductImage(productId, file);
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
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
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

      {error ? <p className="text-xs text-brand">{error}</p> : null}
    </div>
  );
}
