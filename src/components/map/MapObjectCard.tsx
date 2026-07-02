"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, MapPin, Plane, X } from "lucide-react";
import type { MapObject } from "@/lib/map-types";
import { MAP_MARKER_KIND_LABELS } from "@/lib/map-types";
import { MAP_KIND_COLORS } from "@/lib/map-kind-colors";
import { cn } from "@/lib/cn";

type Props = {
  object: MapObject;
  onClose: () => void;
  onSelectObjectId?: (id: string) => void;
  className?: string;
  variant?: "floating" | "sheet";
};

function resolveTourCta(object: MapObject): { label: string; href: string } | null {
  if (object.kind === "tour") {
    return { label: "Страница тура", href: object.href };
  }
  const tour = object.relatedTours?.[0];
  if (tour) return { label: "Смотреть тур", href: tour.href };
  return null;
}

function resolvePrimaryCta(object: MapObject): { label: string; href: string } | null {
  if (object.href && object.kind !== "tour") {
    return { label: "Подробнее", href: object.href };
  }
  return null;
}

function resolveArticleCta(object: MapObject): { label: string; href: string } | null {
  const article = object.relatedArticles?.[0];
  if (!article) return null;
  if (object.href === article.href) return null;
  return { label: article.title, href: article.href };
}

export default function MapObjectCard({
  object,
  onClose,
  onSelectObjectId,
  className,
  variant = "floating",
}: Props) {
  const tourCta = resolveTourCta(object);
  const primaryCta = resolvePrimaryCta(object);
  const articleCta = resolveArticleCta(object);
  const kindColor = MAP_KIND_COLORS[object.kind];

  return (
    <article
      className={cn(
        "w-full overflow-hidden bg-white",
        variant === "floating"
          ? "max-w-[340px] rounded-2xl border border-gray-100/80 shadow-elevated"
          : "rounded-t-2xl",
        className
      )}
    >
      {object.image ? (
        <div className="relative aspect-[16/10] bg-gray-100">
          <Image
            src={object.image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 767px) 100vw, 340px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          <span
            className="absolute bottom-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
            style={{ backgroundColor: kindColor }}
          >
            {MAP_MARKER_KIND_LABELS[object.kind]}
          </span>
        </div>
      ) : (
        <div
          className="relative flex aspect-[16/10] items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${kindColor}22, #ffffff)` }}
        >
          <MapPin className="h-9 w-9" style={{ color: kindColor }} aria-hidden />
          <span
            className="absolute bottom-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white"
            style={{ backgroundColor: kindColor }}
          >
            {MAP_MARKER_KIND_LABELS[object.kind]}
          </span>
        </div>
      )}

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate">{object.region}</p>
            <h2 className="mt-0.5 line-clamp-2 font-heading text-base font-bold leading-snug text-charcoal">
              {object.title}
            </h2>
            {object.meta ? (
              <p className="mt-1 text-xs text-slate">{object.meta}</p>
            ) : null}
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
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate">{object.description}</p>
        ) : null}

        {object.flightDestinations && object.flightDestinations.length > 0 ? (
          <div className="mt-3 rounded-xl bg-sky/5 p-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky">
              <Plane className="h-3.5 w-3.5" aria-hidden />
              Прямые рейсы · {object.flightDestinations.length}
            </p>
            <div className="mt-1.5 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
              {object.flightDestinations.map((dest) => (
                <button
                  key={dest.iata}
                  type="button"
                  title={dest.airportName}
                  onClick={() => onSelectObjectId?.(dest.mapObjectId)}
                  className="inline-flex items-center gap-1 rounded-full border border-sky/20 bg-white px-2 py-1 text-[11px] font-semibold text-charcoal transition hover:border-sky hover:text-sky"
                >
                  {dest.city}
                  <span className="text-[9px] font-bold text-slate">{dest.iata}</span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-slate">
              Направления ориентировочные — расписание меняется по сезонам, уточняйте у авиакомпаний.
            </p>
          </div>
        ) : null}

        {(tourCta || primaryCta || articleCta) && (
          <div className="mt-3 flex flex-col gap-2">
            {tourCta ? (
              <Link
                href={tourCta.href}
                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-sky px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-dark"
              >
                {tourCta.label}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {primaryCta ? (
                <Link
                  href={primaryCta.href}
                  className={cn(
                    "inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-charcoal transition hover:border-sky/30 hover:text-sky",
                    !tourCta && "bg-sky text-white border-transparent hover:bg-sky-dark hover:text-white"
                  )}
                >
                  {!tourCta ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
                  {primaryCta.label}
                </Link>
              ) : null}
              {articleCta ? (
                <Link
                  href={articleCta.href}
                  className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-charcoal transition hover:border-sky/30 hover:text-sky"
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {articleCta.label}
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
