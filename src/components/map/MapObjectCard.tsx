"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, MapPin, X } from "lucide-react";
import type { MapObject } from "@/lib/map-types";
import { cn } from "@/lib/cn";

type Props = {
  object: MapObject;
  onClose: () => void;
  className?: string;
  variant?: "floating" | "sheet";
};

function resolveTourCta(object: MapObject): { label: string; href: string } | null {
  if (object.kind === "tour") {
    return { label: "Страница тура", href: object.href };
  }
  const tour = object.relatedTours?.[0];
  if (tour) return { label: "Тур", href: tour.href };
  return null;
}

function resolveArticleCta(object: MapObject): { label: string; href: string } | null {
  const article = object.relatedArticles?.[0];
  if (article) return { label: "Статья", href: article.href };
  if (object.kind !== "tour" && object.href) {
    return { label: "Подробнее", href: object.href };
  }
  return null;
}

export default function MapObjectCard({ object, onClose, className, variant = "floating" }: Props) {
  const tourCta = resolveTourCta(object);
  const articleCta = resolveArticleCta(object);

  return (
    <article
      className={cn(
        "w-full overflow-hidden bg-white",
        variant === "floating"
          ? "max-w-sm rounded-2xl border border-gray-100 shadow-elevated"
          : "rounded-t-2xl",
        className
      )}
    >
      {object.image ? (
        <div className="relative aspect-[2/1] bg-gray-100">
          <Image src={object.image} alt="" fill className="object-cover" sizes="(max-width: 767px) 100vw, 320px" />
        </div>
      ) : (
        <div className="flex aspect-[2/1] items-center justify-center bg-gradient-to-br from-sky/10 to-white">
          <MapPin className="h-8 w-8 text-sky/60" aria-hidden />
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky">{object.region}</p>
            <h2 className="mt-0.5 line-clamp-2 font-heading text-base font-bold leading-snug text-charcoal">
              {object.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            className="shrink-0 rounded-lg p-1.5 text-slate hover:bg-gray-100"
            aria-label="Закрыть карточку"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {object.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-slate">{object.description}</p>
        ) : null}

        {(tourCta || articleCta) && (
          <div className="mt-3 flex flex-nowrap gap-2 overflow-x-auto">
            {tourCta ? (
              <Link
                href={tourCta.href}
                className="inline-flex min-h-[40px] flex-1 items-center justify-center whitespace-nowrap rounded-xl bg-sky px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-dark"
              >
                {tourCta.label}
              </Link>
            ) : null}
            {articleCta ? (
              <Link
                href={articleCta.href}
                className={cn(
                  "inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-charcoal transition hover:border-sky/30 hover:text-sky",
                  !tourCta && "flex-[2]"
                )}
              >
                <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {articleCta.label}
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
