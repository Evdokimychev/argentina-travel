"use client";

import { useEffect, useRef, useState } from "react";
import { Globe2, Loader2, MapPinned, X } from "lucide-react";
import {
  MAP_THEMATIC_GROUP_LABELS,
  MAP_THEMATIC_LAYERS,
  PUBLIC_MAP_THEMATIC_LAYER_IDS,
  getThematicLayersByGroup,
  type MapThematicLayerGroup,
  type MapThematicLayerId,
  type MapThematicState,
} from "@/lib/map-thematic-layers";
import { cn } from "@/lib/cn";

type Props = {
  thematic: MapThematicState;
  layerAvailability?: Partial<Record<MapThematicLayerId, boolean>>;
  loadingLayerIds?: readonly MapThematicLayerId[];
  onToggleThematic: (layerId: MapThematicLayerId) => void;
  onClearThematic: () => void;
  className?: string;
};

const GROUP_ORDER: MapThematicLayerGroup[] = [
  "borders",
  "regions",
  "climate",
  "cities",
  "nature",
  "routes",
  "culture",
];

export default function MapThematicLayersControl({
  thematic,
  layerAvailability = {},
  loadingLayerIds = [],
  onToggleThematic,
  onClearThematic,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const grouped = getThematicLayersByGroup();

  const activeCount = PUBLIC_MAP_THEMATIC_LAYER_IDS.filter((id) => thematic[id]).length;

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("flex flex-col items-start", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl border shadow-md backdrop-blur-md transition",
          open
            ? "border-violet-500/40 bg-violet-600 text-white"
            : "border-white/60 bg-white/92 text-charcoal hover:border-violet-400/40 hover:text-violet-700"
        )}
        title="Тематические слои"
        aria-expanded={open}
        aria-label="Тематические слои карты"
      >
        <Globe2 className="h-4.5 w-4.5" aria-hidden />
        {activeCount > 0 && !open ? (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="mt-2 max-h-[min(72vh,560px)] w-[296px] overflow-y-auto rounded-2xl border border-white/60 bg-white/95 p-3 shadow-elevated backdrop-blur-md md:max-h-[calc(100dvh-390px)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate">
              Тематические слои
            </span>
            <div className="flex items-center gap-1">
              {activeCount > 0 ? (
                <button
                  type="button"
                  onClick={onClearThematic}
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 hover:bg-violet-50"
                >
                  Сбросить
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate hover:bg-gray-100 hover:text-charcoal"
                aria-label="Закрыть панель тематических слоёв"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>

          <p className="mt-1 text-[10px] leading-snug text-slate">
            Изучайте границы, районы, природные территории и дороги отдельно от пинов. Наведите на область, чтобы увидеть её название.
          </p>

          <div className="mt-3 space-y-3">
            {GROUP_ORDER.map((group) => {
              const layers = grouped[group].filter(
                (layer) => layerAvailability[layer.id] === true,
              );
              if (!layers.length) return null;
              return (
                <section key={group}>
                  <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate">
                    {MAP_THEMATIC_GROUP_LABELS[group]}
                  </h3>
                  <div className="space-y-1">
                    {layers.map((layer) => {
                      const active = thematic[layer.id];
                      const available = layerAvailability[layer.id] === true;
                      const loading = loadingLayerIds.includes(layer.id);
                      const swatch =
                        layer.fillColor ?? layer.lineColor ?? "#64748b";
                      return (
                        <button
                          key={layer.id}
                          type="button"
                          title={layer.description}
                          onClick={() => available && onToggleThematic(layer.id)}
                          disabled={!available || loading}
                          className={cn(
                            "flex w-full items-start gap-2 rounded-lg border px-2 py-2 text-left text-[11px] font-semibold transition",
                            (!available || loading) && "cursor-not-allowed opacity-60",
                            available && active
                              ? "border-violet-500/30 bg-violet-50 text-violet-900"
                              : available
                                ? "border-gray-200/80 bg-white text-charcoal hover:border-violet-300/40 hover:text-violet-800"
                                : "border-gray-200/60 bg-gray-50 text-slate"
                          )}
                          aria-pressed={active}
                        >
                          <span
                            className={cn(
                              "mt-0.5 h-3 w-3 shrink-0 border border-black/10",
                              layer.kind === "circle" ? "rounded-full" : "rounded-sm",
                            )}
                            style={{
                              backgroundColor: swatch,
                              opacity: layer.kind === "line" ? 1 : 0.65,
                            }}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 leading-snug">
                            <span className="block">{layer.label}</span>
                            <span className="mt-0.5 block text-[9px] font-normal leading-snug text-slate">
                              {layer.description}
                            </span>
                            {loading ? (
                              <span className="mt-0.5 flex items-center gap-1 text-[9px] font-medium text-violet-700">
                                <Loader2 className="h-2.5 w-2.5 animate-spin" aria-hidden />
                                Загружаем слой…
                              </span>
                            ) : null}
                          </span>
                          <span
                            className={cn(
                              "h-3.5 w-6 shrink-0 rounded-full transition",
                              active ? "bg-violet-600" : "bg-gray-200"
                            )}
                          >
                            <span
                              className={cn(
                                "block h-3.5 w-3.5 rounded-full border-2 bg-white transition",
                                active
                                  ? "translate-x-2.5 border-violet-600"
                                  : "translate-x-0 border-gray-200"
                              )}
                            />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {activeCount > 0 ? (
            <div className="mt-3 rounded-lg border border-violet-100 bg-violet-50/60 px-2.5 py-2">
              <p className="flex items-center gap-1 text-[10px] font-semibold text-violet-900">
                <MapPinned className="h-3 w-3" aria-hidden />
                Легенда ({activeCount})
              </p>
              <ul className="mt-1 space-y-0.5">
                {PUBLIC_MAP_THEMATIC_LAYER_IDS
                  .map((id) => MAP_THEMATIC_LAYERS[id])
                  .filter((layer) => thematic[layer.id])
                  .map((layer) => (
                    <li
                      key={layer.id}
                      className="flex items-center gap-1.5 text-[10px] text-violet-950"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            layer.fillColor ?? layer.lineColor ?? "#64748b",
                        }}
                      />
                      {layer.label}
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
