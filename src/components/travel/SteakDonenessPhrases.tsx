"use client";

import { useState } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import {
  STEAK_DONENESS_ITEMS,
  STEAK_DONENESS_UI,
} from "@/data/steak-doneness-phrases";
import { STEAK_GUIDE_MEDIA } from "@/data/media/argentinian-steak-guide-media";
import { cn } from "@/lib/cn";
import { mediaUrl } from "@/lib/media/media-cdn";

const slicedSteakPhoto = STEAK_GUIDE_MEDIA.slicedSteak;

type Props = {
  className?: string;
  labels?: typeof STEAK_DONENESS_UI;
};

/**
 * Doneness phrasebook. Phrases are always in the DOM; copy is progressive enhancement.
 */
export default function SteakDonenessPhrases({
  className,
  labels = STEAK_DONENESS_UI,
}: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyPhrase = async (id: string, phrase: string) => {
    try {
      await navigator.clipboard.writeText(phrase);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1600);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <section
      className={cn("space-y-3", className)}
      aria-label={labels.ariaLabel}
    >
      <div>
        <h3 className="font-heading text-base font-semibold text-charcoal">{labels.title}</h3>
        <p className="mt-1 text-sm text-slate">{labels.hint}</p>
      </div>

      <figure className="overflow-hidden rounded-2xl">
        <div className="relative aspect-[16/9] w-full">
          <SafeImage
            src={mediaUrl(slicedSteakPhoto.src)}
            alt={slicedSteakPhoto.alt}
            fill
            sizes="(min-width: 768px) 640px, 100vw"
            className="object-cover"
            placeholderVariant="generic"
          />
        </div>
        <figcaption className="bg-surface-muted/50 px-3 py-1.5 text-xs text-slate">
          Фото иллюстрирует текстуру среза — не эталон конкретной степени прожарки.
        </figcaption>
      </figure>

      <div>
        <div
          className="h-3 w-full rounded-full bg-gradient-to-r from-[#b3352c] via-[#c98a4c] to-[#8a6a4f]"
          aria-hidden
        />
        <ol className="mt-2 grid grid-cols-5 gap-1 text-center">
          {STEAK_DONENESS_ITEMS.map((item) => (
            <li key={item.id} className="text-[11px] leading-tight text-slate">
              {item.term}
            </li>
          ))}
        </ol>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {STEAK_DONENESS_ITEMS.map((item) => (
          <li
            key={item.id}
            // Hairline border only — no shadow layered on top of the item.
            className="flex flex-col rounded-2xl border border-gray-100 bg-surface-muted/20 p-3.5"
          >
            <p className="font-heading text-sm font-bold text-charcoal" lang="es">
              {item.term}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate">{item.meaning}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate">{item.caveat}</p>
            <blockquote className="mt-3 rounded-xl bg-surface-muted/50 px-3 py-2 text-sm text-charcoal">
              <p lang="es" className="font-medium">
                {item.phrase}
              </p>
              <p className="mt-1 text-xs text-slate">{item.phraseRu}</p>
            </blockquote>
            <button
              type="button"
              className="blog-touch-target mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-sky transition hover:border-sky/40"
              onClick={() => void copyPhrase(item.id, item.phrase)}
            >
              {copiedId === item.id ? labels.copiedLabel : labels.copyLabel}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
