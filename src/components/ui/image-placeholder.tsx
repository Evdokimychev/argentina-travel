"use client";

import { ImageIcon, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";

type ImagePlaceholderVariant = "tour" | "avatar" | "generic";

export type { ImagePlaceholderVariant };

const VARIANT_CONFIG: Record<
  ImagePlaceholderVariant,
  { icon: typeof ImageIcon; label: string }
> = {
  tour: { icon: MapPin, label: "Фото тура" },
  avatar: { icon: ImageIcon, label: "Фото" },
  generic: { icon: ImageIcon, label: "Изображение" },
};

interface ImagePlaceholderProps {
  variant?: ImagePlaceholderVariant;
  label?: string;
  className?: string;
  iconClassName?: string;
}

export function ImagePlaceholder({
  variant = "generic",
  label,
  className,
  iconClassName,
}: ImagePlaceholderProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;
  const text = label ?? config.label;

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-sky/10 via-surface-muted to-sky/5 text-slate",
        className
      )}
      aria-hidden={!label}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <Icon className={cn("h-8 w-8 text-sky/60", iconClassName)} strokeWidth={1.5} />
      <span className="text-xs font-medium text-slate/80">{text}</span>
    </div>
  );
}
