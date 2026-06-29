"use client";

import { ImageIcon, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";

/** Единая подпись заглушки для туров, блога, мест и прочих медиа. */
export const IMAGE_PLACEHOLDER_LABEL = "Нет фото";

type ImagePlaceholderVariant = "tour" | "excursion" | "avatar" | "destination" | "generic";

export type { ImagePlaceholderVariant };

interface ImagePlaceholderProps {
  /** @deprecated Все контентные варианты выглядят одинаково; оставлено для совместимости API. */
  variant?: ImagePlaceholderVariant;
  /** Видимая подпись; по умолчанию «Нет фото». */
  label?: string;
  /** Имя для screen readers, если подпись скрыта (compact). */
  ariaLabel?: string;
  className?: string;
  iconClassName?: string;
  /** Скрыть подпись — для миниатюр и аватаров. */
  compact?: boolean;
  /** Пульсация, пока грузится реальное изображение. */
  loading?: boolean;
}

export function ImagePlaceholder({
  variant = "generic",
  label,
  ariaLabel,
  className,
  iconClassName,
  compact = false,
  loading = false,
}: ImagePlaceholderProps) {
  const isAvatar = variant === "avatar";
  const Icon = isAvatar ? UserRound : ImageIcon;
  const displayLabel = label ?? IMAGE_PLACEHOLDER_LABEL;
  const showCaption = !compact;
  const accessibleName = ariaLabel ?? displayLabel;

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2",
        "bg-gradient-to-br from-surface-muted via-surface-elevated to-surface-muted",
        loading && "animate-pulse",
        className,
      )}
      role="img"
      aria-label={accessibleName}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-white/40 text-sky/70 backdrop-blur-[1px]",
          compact ? "h-8 w-8" : "h-12 w-12",
        )}
      >
        <Icon
          className={cn(compact ? "h-4 w-4" : "h-8 w-8", iconClassName)}
          strokeWidth={1.5}
        />
      </span>
      {showCaption ? (
        <span className="max-w-[90%] truncate px-2 text-center text-xs font-medium text-slate/80">
          {displayLabel}
        </span>
      ) : null}
    </div>
  );
}

export default ImagePlaceholder;
