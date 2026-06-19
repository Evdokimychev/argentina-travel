"use client";

import { Compass, ImageIcon, MapPin, Mountain, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";

type ImagePlaceholderVariant = "tour" | "excursion" | "avatar" | "destination" | "generic";

export type { ImagePlaceholderVariant };

const VARIANT_CONFIG: Record<
  ImagePlaceholderVariant,
  { icon: typeof ImageIcon; label: string; iconSize: string }
> = {
  tour: { icon: MapPin, label: "Фото тура", iconSize: "h-8 w-8" },
  excursion: { icon: Compass, label: "Фото экскурсии", iconSize: "h-8 w-8" },
  avatar: { icon: UserRound, label: "Фото профиля", iconSize: "h-5 w-5" },
  destination: { icon: Mountain, label: "Фото направления", iconSize: "h-9 w-9" },
  generic: { icon: ImageIcon, label: "Изображение", iconSize: "h-8 w-8" },
};

interface ImagePlaceholderProps {
  variant?: ImagePlaceholderVariant;
  label?: string;
  className?: string;
  iconClassName?: string;
  /** Hide caption — for small crops (avatars, thumbnails). */
  compact?: boolean;
  /** Pulse animation while the real image loads. */
  loading?: boolean;
}

export function ImagePlaceholder({
  variant = "generic",
  label,
  className,
  iconClassName,
  compact = false,
  loading = false,
}: ImagePlaceholderProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;
  const text = label ?? config.label;
  const showCaption = !compact && Boolean(text);

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2",
        "bg-gradient-to-br from-sky/30 via-sky/10 to-surface-muted",
        loading && "animate-pulse",
        className,
      )}
      aria-hidden={!label}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-white/40 text-sky/70 backdrop-blur-[1px]",
          compact ? "h-8 w-8" : "h-12 w-12",
        )}
      >
        <Icon
          className={cn(compact ? "h-4 w-4" : config.iconSize, iconClassName)}
          strokeWidth={1.5}
        />
      </span>
      {showCaption ? (
        <span className="max-w-[90%] truncate px-2 text-center text-xs font-medium text-slate/80">
          {text}
        </span>
      ) : null}
    </div>
  );
}
