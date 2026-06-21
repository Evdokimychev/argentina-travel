"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import CmsMediaPickerDialog from "@/components/admin/CmsMediaPickerDialog";
import { mediaUrl } from "@/lib/media-resolver";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  hint?: string;
  className?: string;
};

export default function CmsMediaPathField({
  value,
  onChange,
  label,
  placeholder = "/media/... или https://",
  hint,
  className,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className={className}>
      {label ? (
        <span className="text-sm text-slate">
          {label}
          {hint ? <span className="ml-2 text-xs text-slate">{hint}</span> : null}
        </span>
      ) : null}
      <div className={`flex flex-wrap items-center gap-3 ${label ? "mt-1" : ""}`}>
        {value ? (
          <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
            <SafeImage src={mediaUrl(value)} alt="" fill className="object-cover" sizes="112px" />
          </div>
        ) : (
          <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 text-xs text-slate">
            Нет изображения
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="font-mono text-xs"
          />
          <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
            Выбрать из медиатеки
          </Button>
        </div>
      </div>
      <CmsMediaPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onChange}
      />
    </div>
  );
}
