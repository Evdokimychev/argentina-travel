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
import type { NearbyMapObject } from "@/lib/map-discovery";

type Props = {
  object: MapObject;
  onClose: () => void;
  onSelectObjectId?: (id: string) => void;
  selectedFlightDestinationIata?: string | null;
  onSelectFlightDestination?: (iata: string | null) => void;
  onNavigate?: (href: string) => void;
  nearbyObjects?: NearbyMapObject[];
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

function formatFlightDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return [hours ? `${hours} ч` : "", restMinutes ? `${restMinutes} мин` : ""]
    .filter(Boolean)
    .join(" ");
}

export default function MapObjectCard({
  object,
  onClose,
  onSelectObjectId,
  selectedFlightDestinationIata,
  onSelectFlightDestination,
  onNavigate,
  nearbyObjects = [],
  className,
  variant = "floating",
}: Props) {
  const [localSelectedDestinationIata, setLocalSelectedDestinationIata] = useState<string | null>(null);
  useEffect(() => setLocalSelectedDestinationIata(null), [object.id]);
  const selectedDestinationIata =
    selectedFlightDestinationIata === undefined
      ? localSelectedDestinationIata
      : selectedFlightDestinationIata;
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

  function selectFlightDestination(iata: string) {
    setLocalSelectedDestinationIata(iata);
    onSelectFlightDestination?.(iata);
  }

  function handleNavigation(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (!onNavigate) return;
    event.preventDefault();
    onNavigate(href);
  }

  return (
    <article
      className={cn(
        "w-full overflow-x-hidden overflow-y-auto overscroll-contain bg-surface-elevated",
        variant === "floating"
          ? "max-h-[calc(100dvh-var(--site-header-full-height,72px)-3rem)] max-w-[340px] rounded-card border border-border-subtle shadow-elevated"
          : "h-full min-h-0 rounded-t-2xl",
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

        {object.curatorNote ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900">
            {object.curatorNote}
          </p>
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
              <dt className="text-muted">Дата актуальности</dt>
              <dd className="mt-0.5 font-semibold text-foreground">
                {object.sourceVerifiedAt ? new Date(`${object.sourceVerifiedAt}T12:00:00Z`).toLocaleDateString("ru-RU") : "Не указано"}
              </dd>
            </div>
          </dl>
        ) : null}

        {!object.airportDetails && nearbyObjects.length > 0 ? (
          <section className="mt-3 border-t border-border-subtle pt-3" aria-labelledby="nearby-map-objects-title">
            <div className="flex items-center justify-between gap-2">
              <h3 id="nearby-map-objects-title" className="text-xs font-semibold text-charcoal">
                Что рядом
              </h3>
              <span className="text-[10px] text-muted">до 120 км</span>
            </div>
            <div className="mt-2 grid gap-1.5">
              {nearbyObjects.map(({ object: nearby, distanceKm }) => (
                <button
                  key={nearby.id}
                  type="button"
                  onClick={() => onSelectObjectId?.(nearby.id)}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-border-subtle bg-surface-muted/50 px-2.5 py-2 text-left transition hover:border-sky/30 hover:bg-sky/5"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white"
                    style={{ backgroundColor: MAP_KIND_COLORS[nearby.kind] }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-charcoal">{nearby.title}</span>
                    <span className="block truncate text-[10px] text-muted">
                      {MAP_MARKER_KIND_LABELS[nearby.kind]}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold text-slate">
                    {distanceKm < 1 ? "рядом" : `${Math.round(distanceKm)} км`}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {object.flightDestinations && object.flightDestinations.length > 0 ? (
          <div className="mt-3 rounded-card bg-sky/5 p-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-ink">
              <Plane className="h-3.5 w-3.5" aria-hidden />
              Прямые направления · {object.flightDestinations.length}
            </p>
            <div className="mt-1.5 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
              {object.flightDestinations.map((dest) => (
                <button
                  key={dest.iata}
                  type="button"
                  title={dest.airportName}
                  aria-pressed={selectedDestinationIata === dest.iata}
                  onClick={() => {
                    selectFlightDestination(dest.iata);
                    trackProductEvent("airport_route_selected", {
                      entityType: "airport_route",
                      entityId: `${object.airportDetails?.iata ?? object.slug}-${dest.iata}`,
                      source: "map_airport_card",
                    });
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold transition",
                    selectedDestinationIata === dest.iata
                      ? "border-sky-ink bg-sky-ink text-white shadow-sm"
                      : "border-sky/20 bg-surface-elevated text-charcoal hover:border-sky hover:text-sky-ink",
                  )}
                >
                  {dest.city}
                  <span
                    className={cn(
                      "text-[9px] font-bold",
                      selectedDestinationIata === dest.iata ? "text-white/80" : "text-slate",
                    )}
                  >
                    {dest.iata}
                  </span>
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
                  Около {selectedRouteDistance?.toLocaleString("ru-RU")} км
                  {selectedDestination.durationMinutes
                    ? ` · примерно ${formatFlightDuration(selectedDestination.durationMinutes)}`
                    : ""}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 font-semibold",
                      selectedDestination.service === "regular"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {selectedDestination.service === "regular" ? "Регулярный" : "Сезонный или ограниченный"}
                  </span>
                  {selectedDestination.airlines?.length ? (
                    <span>{selectedDestination.airlines.join(", ")}</span>
                  ) : null}
                </div>
                {selectedDestination.frequencyNote ? (
                  <p className="mt-1 text-[10px] text-muted">{selectedDestination.frequencyNote}</p>
                ) : null}
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
                    onClick={(event) =>
                      handleNavigation(
                        event,
                        buildFlightsSearchHref(object.airportDetails!.iata, selectedDestination.iata),
                      )
                    }
                    className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-button bg-sky-ink px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-ink/90"
                  >
                    <Plane className="h-3.5 w-3.5" aria-hidden />
                    Перейти к поиску билетов
                  </Link>
                </div>
                <p className="mt-2 text-[10px] text-muted">
                  Проверено {new Date(`${selectedDestination.verifiedAt}T12:00:00Z`).toLocaleDateString("ru-RU")}.{" "}
                  <a
                    href={selectedDestination.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-sky hover:underline"
                  >
                    Проверить расписание
                  </a>
                </p>
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
                onClick={(event) => handleNavigation(event, tourCta.href)}
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
                  onClick={(event) => handleNavigation(event, primaryCta.href)}
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
                  onClick={(event) => handleNavigation(event, articleCta.href)}
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
