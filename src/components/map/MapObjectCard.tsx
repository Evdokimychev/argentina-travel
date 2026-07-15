"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ExternalLink, MapPin, Plane, Route, X } from "lucide-react";
import type { MapObject } from "@/lib/map-types";
import { MAP_MARKER_KIND_LABELS } from "@/lib/map-types";
import { MAP_KIND_COLORS } from "@/lib/map-kind-colors";
import { cn } from "@/lib/cn";
import { buildFlightsSearchHref } from "@/lib/flights/search-href";
import { trackProductEvent } from "@/lib/analytics/product-events";

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

function airportRouteDistanceKm(
  from: Pick<MapObject, "latitude" | "longitude">,
  to: { latitude: number; longitude: number },
): number {
  const radians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDelta = radians(to.latitude - from.latitude);
  const lngDelta = radians(to.longitude - from.longitude);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(lngDelta / 2) ** 2;
  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function MapObjectCard({
  object,
  onClose,
  onSelectObjectId,
  className,
  variant = "floating",
}: Props) {
  const [selectedDestinationIata, setSelectedDestinationIata] = useState<string | null>(null);
  useEffect(() => setSelectedDestinationIata(null), [object.id]);
  const tourCta = resolveTourCta(object);
  const primaryCta = resolvePrimaryCta(object);
  const articleCta = resolveArticleCta(object);
  const kindColor = MAP_KIND_COLORS[object.kind];
  const selectedDestination = useMemo(
    () => object.flightDestinations?.find((item) => item.iata === selectedDestinationIata) ?? null,
    [object.flightDestinations, selectedDestinationIata],
  );
  const selectedRouteDistance = selectedDestination
    ? airportRouteDistanceKm(object, selectedDestination)
    : null;

  return (
    <article
      className={cn(
        "w-full overflow-hidden bg-surface-elevated",
        variant === "floating"
          ? "max-w-[340px] rounded-card border border-border-subtle shadow-elevated"
          : "rounded-t-2xl",
        className
      )}
    >
      {object.image ? (
        <div className="relative aspect-[16/10] bg-surface-muted">
          <Image
            src={object.image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 767px) 100vw, 340px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/35 via-transparent to-transparent" />
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
            className="shrink-0 rounded-button p-1.5 text-slate hover:bg-surface-muted"
            aria-label="Закрыть карточку"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {object.description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate">{object.description}</p>
        ) : null}

        {object.airportDetails ? (
          <dl className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border-subtle bg-surface-muted/60 p-3 text-xs">
            <div>
              <dt className="text-muted">Город и код</dt>
              <dd className="mt-0.5 font-semibold text-foreground">{object.airportDetails.city} · {object.airportDetails.iata}</dd>
            </div>
            <div>
              <dt className="text-muted">Роль</dt>
              <dd className="mt-0.5 font-semibold text-foreground">{object.airportDetails.role}</dd>
            </div>
            <div>
              <dt className="text-muted">Внутренние направления</dt>
              <dd className="mt-0.5 font-semibold text-foreground">{object.airportDetails.domesticRoutes || "Нет данных"}</dd>
            </div>
            <div>
              <dt className="text-muted">Проверено</dt>
              <dd className="mt-0.5 font-semibold text-foreground">
                {object.sourceVerifiedAt ? new Date(`${object.sourceVerifiedAt}T12:00:00Z`).toLocaleDateString("ru-RU") : "Не указано"}
              </dd>
            </div>
          </dl>
        ) : null}

        {object.flightDestinations && object.flightDestinations.length > 0 ? (
          <div className="mt-3 rounded-card bg-sky/5 p-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-ink">
              <Plane className="h-3.5 w-3.5" aria-hidden />
              Прямые рейсы · {object.flightDestinations.length}
            </p>
            <div className="mt-1.5 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
              {object.flightDestinations.map((dest) => (
                <button
                  key={dest.iata}
                  type="button"
                  title={dest.airportName}
                  onClick={() => {
                    setSelectedDestinationIata(dest.iata);
                    trackProductEvent("airport_route_selected", {
                      entityType: "airport_route",
                      entityId: `${object.airportDetails?.iata ?? object.slug}-${dest.iata}`,
                      source: "map_airport_card",
                    });
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-sky/20 bg-surface-elevated px-2 py-1 text-[11px] font-semibold text-charcoal transition hover:border-sky hover:text-sky-ink"
                >
                  {dest.city}
                  <span className="text-[9px] font-bold text-slate">{dest.iata}</span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-slate">
              {object.airportDetails?.seasonalityNote ?? "Направления ориентировочные — расписание меняется по сезонам."}
            </p>
            {selectedDestination && object.airportDetails ? (
              <div className="mt-2 rounded-lg border border-sky/20 bg-white p-2.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Route className="h-3.5 w-3.5 text-sky" aria-hidden />
                  {object.airportDetails.iata} → {selectedDestination.iata}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  Около {selectedRouteDistance?.toLocaleString("ru-RU")} км · ориентировочно {Math.max(1, Math.round((selectedRouteDistance ?? 0) / 750 * 10) / 10)} ч в воздухе
                </p>
                <p className="mt-1 text-[10px] text-muted">Внутренний маршрут. Время не учитывает пересадки, ожидание и изменения перевозчика.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectObjectId?.(selectedDestination.mapObjectId)}
                    className="text-xs font-semibold text-sky hover:underline"
                  >
                    Показать аэропорт назначения
                  </button>
                  <Link
                    href={buildFlightsSearchHref(object.airportDetails.iata, selectedDestination.iata)}
                    className="text-xs font-semibold text-sky hover:underline"
                  >
                    Найти билеты
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {object.airportDetails ? (
          <div className="mt-3 text-[10px] leading-relaxed text-muted">
            <p>{object.airportDetails.internationalNote}</p>
            <p className="mt-1">
              Источник: {object.sourceUrl ? (
                <a href={object.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-sky hover:underline">
                  {object.source}<ExternalLink className="h-2.5 w-2.5" aria-hidden />
                </a>
              ) : object.source}. Расписание может меняться.
            </p>
          </div>
        ) : null}

        {(tourCta || primaryCta || articleCta) && (
          <div className="mt-3 flex flex-col gap-2">
            {tourCta ? (
              <Link
                href={tourCta.href}
                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-button bg-sky-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-ink/90"
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
                    "inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-button border border-border-default px-3 py-2 text-sm font-semibold text-charcoal transition hover:border-sky/30 hover:text-sky-ink",
                    !tourCta && "bg-sky-ink text-white border-transparent hover:bg-sky-ink/90 hover:text-white"
                  )}
                >
                  {!tourCta ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
                  {primaryCta.label}
                </Link>
              ) : null}
              {articleCta ? (
                <Link
                  href={articleCta.href}
                  className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-button border border-border-default px-3 py-2 text-sm font-semibold text-charcoal transition hover:border-sky/30 hover:text-sky-ink"
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
