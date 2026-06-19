"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDown, ArrowUp, MapPin, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ORGANIZER_ROUTE_POINTS_MAX,
  ROUTE_LOCATION_OPTIONS,
  createEmptyRoutePoint,
  isValidRoutePointCoords,
  lookupLocationCoords,
} from "@/data/tour-route-defaults";
import type { TourRoutePoint } from "@/types";
import { cn } from "@/lib/cn";

const RouteMap = dynamic(() => import("@/components/tour-detail/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[220px] items-center justify-center bg-gray-50 text-sm text-slate">
      Загрузка карты…
    </div>
  ),
});

interface TourRoutePointsEditorProps {
  routePoints: TourRoutePoint[];
  durationDays: number;
  onChange: (points: TourRoutePoint[]) => void;
}

function parseCoord(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function PointCard({
  point,
  index,
  total,
  durationDays,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canRemove,
}: {
  point: TourRoutePoint;
  index: number;
  total: number;
  durationDays: number;
  onChange: (next: TourRoutePoint) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canRemove: boolean;
}) {
  const hasCoords = isValidRoutePointCoords(point.lat, point.lng);
  const dayOptions = Array.from({ length: Math.max(1, durationDays) }, (_, i) => i + 1);

  function applyLocation(name: string) {
    const coords = lookupLocationCoords(name);
    onChange({
      ...point,
      name,
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
    });
  }

  return (
    <article className="space-y-4 rounded-2xl border border-gray-200/80 bg-gray-50/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-gray-200/80 px-2 text-xs font-semibold text-charcoal">
            {index + 1}
          </span>
          <h3 className="text-sm font-semibold text-charcoal">Точка маршрута</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate transition-colors hover:bg-white hover:text-charcoal disabled:opacity-30"
            aria-label="Переместить выше"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={index >= total - 1}
            onClick={onMoveDown}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate transition-colors hover:bg-white hover:text-charcoal disabled:opacity-30"
            aria-label="Переместить ниже"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          {canRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate transition-colors hover:bg-white hover:text-brand"
              aria-label="Удалить точку"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-charcoal">Быстрый выбор локации</span>
        <select
          value=""
          onChange={(event) => {
            const value = event.target.value;
            if (value) applyLocation(value);
          }}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-charcoal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">Выберите город или достопримечательность</option>
          {ROUTE_LOCATION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-charcoal">
          Название<span className="text-brand">*</span>
        </span>
        <Input
          value={point.name}
          onChange={(event) => onChange({ ...point, name: event.target.value })}
          placeholder="Эль-Калафате"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-charcoal">Широта</span>
          <Input
            value={point.lat || ""}
            onChange={(event) => onChange({ ...point, lat: parseCoord(event.target.value) })}
            placeholder="-50.3378"
            inputMode="decimal"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-charcoal">Долгота</span>
          <Input
            value={point.lng || ""}
            onChange={(event) => onChange({ ...point, lng: parseCoord(event.target.value) })}
            placeholder="-72.2642"
            inputMode="decimal"
          />
        </label>
      </div>

      {!hasCoords ? (
        <p className="text-xs text-amber-700">
          Укажите координаты или выберите локацию из списка — без них точка не появится на карте.
        </p>
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-charcoal">День программы</span>
        <select
          value={point.dayNumber ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            onChange({
              ...point,
              dayNumber: value ? Number(value) : undefined,
            });
          }}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-charcoal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">Не указан</option>
          {dayOptions.map((day) => (
            <option key={day} value={day}>
              День {day}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}

export default function TourRoutePointsEditor({
  routePoints,
  durationDays,
  onChange,
}: TourRoutePointsEditorProps) {
  const points = routePoints.length ? routePoints : [];
  const canAdd = points.length < ORGANIZER_ROUTE_POINTS_MAX;
  const [selectedId, setSelectedId] = useState<string | null>(points[0]?.id ?? null);

  const previewPoints = useMemo(
    () => points.filter((point) => isValidRoutePointCoords(point.lat, point.lng) && point.name.trim()),
    [points]
  );

  function updateAt(index: number, next: TourRoutePoint) {
    onChange(points.map((item, itemIndex) => (itemIndex === index ? next : item)));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= points.length) return;
    const next = [...points];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(points.filter((_, itemIndex) => itemIndex !== index));
  }

  function addPoint() {
    if (!canAdd) return;
    const next = [...points, createEmptyRoutePoint(points.length + 1)];
    onChange(next);
    setSelectedId(next[next.length - 1]?.id ?? null);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">Маршрут на карте</h2>
        <p className="text-sm text-slate">
          Добавьте точки маршрута — они отобразятся на интерактивной карте на странице тура.
        </p>
      </div>

      {previewPoints.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <RouteMap
            points={previewPoints}
            selectedId={selectedId}
            onSelect={setSelectedId}
            className="h-56 sm:h-64"
          />
          <p className="border-t border-gray-100 px-4 py-2 text-[11px] text-slate/80">
            Предпросмотр — на странице тура карта будет сопровождаться списком точек.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 text-center"
          )}
        >
          <MapPin className="h-5 w-5 text-slate" />
          <p className="text-sm text-slate">Добавьте точки с координатами, чтобы увидеть маршрут</p>
        </div>
      )}

      <div className="space-y-4">
        {points.map((point, index) => (
          <PointCard
            key={point.id}
            point={point}
            index={index}
            total={points.length}
            durationDays={durationDays}
            onChange={(next) => updateAt(index, next)}
            onRemove={() => removeAt(index)}
            onMoveUp={() => moveItem(index, -1)}
            onMoveDown={() => moveItem(index, 1)}
            canRemove
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={!canAdd}
        onClick={addPoint}
        className="w-full gap-2 border-dashed"
      >
        <Plus className="h-4 w-4" />
        Добавить точку маршрута
      </Button>

      {!canAdd ? (
        <p className="text-xs text-slate">Максимум {ORGANIZER_ROUTE_POINTS_MAX} точек на маршруте.</p>
      ) : null}
    </section>
  );
}
