"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cabinetCardClass } from "@/lib/cabinet-ui";

type Props = {
  onUploaded: (info?: { manifestSkipped?: boolean }) => void;
  disabled?: boolean;
};

export default function MediaUploadDropzone({ onUploaded, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (list.length === 0) {
        setError("Выберите файлы изображений (JPEG, PNG, WebP, GIF, AVIF)");
        return;
      }

      setUploading(true);
      setError(null);
      let manifestSkipped = false;
      try {
        for (const file of list) {
          const form = new FormData();
          form.append("file", file);
          form.append("title", file.name.replace(/\.[^.]+$/, ""));
          const res = await fetch("/api/admin/media", { method: "POST", body: form });
          const json = (await res.json()) as {
            error?: string;
            manifestSync?: { skipped?: boolean };
          };
          if (!res.ok) throw new Error(json.error ?? "Ошибка загрузки");
          if (json.manifestSync?.skipped) manifestSkipped = true;
        }
        onUploaded({ manifestSkipped });
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Ошибка загрузки");
      } finally {
        setUploading(false);
        setDragOver(false);
      }
    },
    [onUploaded]
  );

  return (
    <div
      className={`${cabinetCardClass} border-2 border-dashed p-6 transition ${
        dragOver ? "border-sky/50 bg-sky/5" : "border-gray-200"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        if (disabled || uploading) return;
        void uploadFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        multiple
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(e) => {
          if (e.target.files?.length) void uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <Upload className="h-8 w-8 text-sky" aria-hidden />
        <p className="text-sm text-charcoal">
          Перетащите изображения или{" "}
          <button
            type="button"
            className="font-medium text-sky hover:underline"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            выберите файлы
          </button>
        </p>
        <p className="text-xs text-slate">
          До 10 МБ · JPEG, PNG, WebP, GIF, AVIF · оптимизация в WebP · Supabase Storage
        </p>
        {uploading ? <p className="text-sm text-sky">Загрузка…</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          Загрузить
        </Button>
      </div>
    </div>
  );
}
