"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  MapPin,
  Maximize2,
  Pause,
  Play,
} from "lucide-react";
import type { TourArrivalInfo, TourRoutePoint } from "@/types";
import type { TourLogistics } from "@/types/tour";
import {
  computeRouteDistanceKm,
  formatRouteDistanceKm,
  getRoutePointRole,
  pointIndexToProgress,
  progressToPointIndex,
} from "@/lib/tour-route-map";
import { cn } from "@/lib/cn";
import TourSection from "./TourSection";
import ArrivalDetails, { getArrivalScheduleCities } from "./ArrivalDetails";

const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[288px] items-center justify-center bg-gray-50 text-sm text-slate lg:min-h-[420px]">
      Загрузка карты…
    </div>
  ),
});

interface RouteMapSectionProps {
  points?: TourRoutePoint[];
  arrival?: TourArrivalInfo;
  logistics?: TourLogistics;
  routeMapImage?: string;
  organizerComment?: string;
}

const PLAY_MS_PER_SEGMENT = 2200;

export default function RouteMapSection({
  points = [],
  arrival,
  logistics,
  routeMapImage,
  organizerComment,
}: RouteMapSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(points[0]?.id ?? null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fitToken, setFitToken] = useState(0);

  const hasMap = points.length > 0;
  const routeDistanceKm = useMemo(() => computeRouteDistanceKm(points), [points]);
  const selectedIndex = useMemo(
    () => points.findIndex((point) => point.id === selectedId),
    [points, selectedId]
  );
  const activePoint = selectedIndex >= 0 ? points[selectedIndex] : points[0];

  const selectByIndex = useCallback(
    (index: number) => {
      const point = points[index];
      if (!point) return;
      setSelectedId(point.id);
      setProgress(pointIndexToProgress(index, points.length));
    },
    [points]
  );

  useEffect(() => {
    if (!points.length) {
      setSelectedId(null);
      setProgress(0);
      return;
    }
    if (!points.some((point) => point.id === selectedId)) {
      setSelectedId(points[0].id);
      setProgress(0);
    }
  }, [points, selectedId]);

  useEffect(() => {
    if (!isPlaying || points.length < 2) return;

    const startProgress = progress;
    const remaining = 1 - startProgress;
    if (remaining <= 0) {
      setIsPlaying(false);
      return;
    }

    let startTime: number | null = null;
    let frame = 0;
    const duration = remaining * (points.length - 1) * PLAY_MS_PER_SEGMENT;

    function tick(timestamp: number) {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const nextProgress = Math.min(1, startProgress + (elapsed / duration) * remaining);
      setProgress(nextProgress);
      setSelectedId(points[progressToPointIndex(nextProgress, points.length)].id);

      if (nextProgress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setIsPlaying(false);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // progress intentionally omitted — captured when playback starts
  }, [isPlaying, points]);

  const hasRouteImage = Boolean(routeMapImage?.trim());
  const hasArrivalSchedule = getArrivalScheduleCities(logistics).length > 0;
  const hasArrivalPanel = Boolean(
    arrival &&
      (hasArrivalSchedule ||
        arrival.airports.length > 0 ||
        arrival.flights.length > 0 ||
        arrival.transfers.length > 0 ||
        arrival.meetingPoint.trim())
  );

  if (!hasMap && !hasArrivalPanel && !hasRouteImage) return null;

  function handleProgressChange(value: number) {
    const nextProgress = value / 100;
    setProgress(nextProgress);
    setSelectedId(points[progressToPointIndex(nextProgress, points.length)].id);
    setIsPlaying(false);
  }

  function handleSelect(id: string) {
    const index = points.findIndex((point) => point.id === id);
    if (index < 0) return;
    selectByIndex(index);
    setIsPlaying(false);
  }

  function stepBy(delta: number) {
    const baseIndex = selectedIndex >= 0 ? selectedIndex : 0;
    selectByIndex(Math.min(points.length - 1, Math.max(0, baseIndex + delta)));
    setIsPlaying(false);
  }

  return (
    <TourSection id="route-map" title="Маршрут и дорога" organizerComment={organizerComment}>
      {hasRouteImage ? (
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-bold text-charcoal">Схема маршрута</h3>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={routeMapImage!}
                alt="Схема маршрута"
                fill
                className="object-contain bg-gray-50 p-2"
                sizes="(max-width: 768px) 100vw, 900px"
              />
            </div>
          </figure>
        </div>
      ) : null}

      {hasMap ? (
        <div className={cn("space-y-4", hasRouteImage && "mt-8")}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-heading text-lg font-bold text-charcoal">Маршрут на карте</h3>
              <p className="mt-1 text-sm text-slate">
                Пройдите маршрут бегунком или запустите анимацию — точки связаны по порядку следования
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-success-muted px-3 py-1.5 font-semibold text-success">
                {points.length} {points.length === 1 ? "точка" : points.length < 5 ? "точки" : "точек"}
              </span>
              {routeDistanceKm > 0 ? (
                <span className="rounded-full bg-gray-100 px-3 py-1.5 font-semibold text-charcoal">
                  ≈ {formatRouteDistanceKm(routeDistanceKm)} по прямой
                </span>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1fr_260px]">
              <RouteMap
                points={points}
                selectedId={selectedId}
                progress={progress}
                onSelect={handleSelect}
                fitToken={fitToken}
                className="h-72 lg:h-[420px]"
              />

              <ol className="flex flex-col gap-1 border-t border-gray-100 p-4 lg:max-h-[420px] lg:overflow-y-auto lg:border-l lg:border-t-0">
                {points.map((point, index) => {
                  const active = point.id === selectedId;
                  const role = getRoutePointRole(index, points.length);
                  return (
                    <li key={point.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(point.id)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                          active
                            ? "bg-brand-light text-charcoal"
                            : "text-slate hover:bg-gray-50 hover:text-charcoal"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            role === "start" && (active ? "bg-success text-white" : "bg-success/15 text-success"),
                            role === "finish" &&
                              (active ? "bg-charcoal text-white" : "bg-charcoal/10 text-charcoal"),
                            role === "waypoint" && (active ? "bg-brand text-white" : "bg-gray-100 text-charcoal")
                          )}
                          aria-hidden
                        >
                          {role === "start" ? "С" : role === "finish" ? "Ф" : index + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-medium leading-snug">{point.name}</span>
                            {role === "start" ? (
                              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
                                Старт
                              </span>
                            ) : null}
                            {role === "finish" ? (
                              <span className="rounded-full bg-charcoal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-charcoal">
                                Финиш
                              </span>
                            ) : null}
                          </span>
                          {point.dayNumber != null ? (
                            <span className="mt-0.5 flex items-center gap-1 text-xs text-slate">
                              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                              День {point.dayNumber}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="space-y-3 border-t border-gray-100 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-charcoal">
                  {activePoint?.name ?? "—"}
                  {activePoint?.dayNumber != null ? (
                    <span className="font-normal text-slate"> · День {activePoint.dayNumber}</span>
                  ) : null}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => stepBy(-1)}
                    disabled={selectedIndex <= 0}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-charcoal transition-colors hover:bg-gray-50 disabled:opacity-40"
                    aria-label="Предыдущая точка"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPlaying((value) => !value)}
                    disabled={points.length < 2}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white transition-colors hover:bg-brand/90 disabled:opacity-40"
                    aria-label={isPlaying ? "Пауза" : "Проиграть маршрут"}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => stepBy(1)}
                    disabled={selectedIndex >= points.length - 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-charcoal transition-colors hover:bg-gray-50 disabled:opacity-40"
                    aria-label="Следующая точка"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFitToken((value) => value + 1);
                      setIsPlaying(false);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-charcoal transition-colors hover:bg-gray-50"
                    aria-label="Показать весь маршрут"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-success">
                  <Flag className="h-3 w-3" aria-hidden />
                  Старт
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={points.length > 2 ? 100 / (points.length - 1) / 4 : 1}
                  value={Math.round(progress * 100)}
                  onChange={(event) => handleProgressChange(Number(event.target.value))}
                  className="route-map-progress h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-brand"
                  aria-label="Прогресс по маршруту"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress * 100)}
                />
                <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-charcoal">
                  Финиш
                  <Flag className="h-3 w-3 rotate-180" aria-hidden />
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate">
                <span>
                  Пройдено:{" "}
                  <strong className="text-charcoal">
                    {selectedIndex >= 0 ? selectedIndex + 1 : 0} из {points.length}
                  </strong>
                </span>
                <span className="inline-flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded-full bg-success" aria-hidden />
                    пройдено
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-0.5 w-4 rounded-full bg-brand/50"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(90deg, #d4533b 0 3px, transparent 3px 6px)",
                      }}
                      aria-hidden
                    />
                    впереди
                  </span>
                </span>
              </div>
            </div>

            <p className="border-t border-gray-100 px-4 py-2.5 text-[11px] leading-relaxed text-slate/80">
              Карта построена по OpenStreetMap и CARTO — бесплатные сервисы с открытыми данными.
            </p>
          </div>
        </div>
      ) : null}

      {arrival && hasArrivalPanel ? (
        <div className={cn("space-y-4", (hasMap || hasRouteImage) && "mt-8")}>
          <div>
            <h3 className="font-heading text-lg font-bold text-charcoal">Как добраться</h3>
            <p className="mt-1 text-sm text-slate">
              Когда прилетать и вылетать, аэропорты, трансферы и место встречи
            </p>
          </div>
          <ArrivalDetails arrival={arrival} logistics={logistics} />
        </div>
      ) : null}
    </TourSection>
  );
}
