"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { mediaUrl } from "@/lib/media-resolver";
import type { MediaAsset } from "@/types/media-asset";

type Props = {
  assets: MediaAsset[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export default function MediaLightbox({ assets, index, onClose, onNavigate }: Props) {
  const asset = assets[index];
  const hasPrev = index > 0;
  const hasNext = index < assets.length - 1;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(index - 1);
      if (e.key === "ArrowRight" && hasNext) onNavigate(index + 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasNext, hasPrev, index, onClose, onNavigate]);

  if (!asset) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр изображения"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 text-white hover:bg-white/10"
        onClick={onClose}
        aria-label="Закрыть"
      >
        <X className="h-5 w-5" />
      </Button>

      {hasPrev ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
          onClick={() => onNavigate(index - 1)}
          aria-label="Предыдущее"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      ) : null}

      {hasNext ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
          onClick={() => onNavigate(index + 1)}
          aria-label="Следующее"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      ) : null}

      <div className="max-h-[85vh] max-w-5xl overflow-hidden rounded-2xl bg-black">
        <div className="relative aspect-[16/10] w-[min(90vw,960px)]">
          <SafeImage
            src={mediaUrl(asset.localPath)}
            alt={asset.alt}
            fill
            className="object-contain"
            sizes="960px"
            priority
          />
        </div>
        <div className="space-y-1 bg-charcoal/95 px-4 py-3 text-sm text-white">
          <p className="font-medium">{asset.title}</p>
          <p className="text-xs text-white/70">{asset.id}</p>
          {asset.alt ? <p className="text-xs text-white/80">{asset.alt}</p> : null}
        </div>
      </div>
    </div>
  );
}
