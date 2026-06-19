"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { MAP_LAYER_IDS, type MapLayerId } from "@/lib/map-types";

const LAYER_LABELS: Record<MapLayerId, string> = {
  tours: "Туры",
  places: "Места",
  regions: "Регионы",
  routes: "Маршруты",
};

interface MapLayerTogglesProps {
  activeLayers: MapLayerId[];
  onToggle: (layer: MapLayerId) => void;
  className?: string;
}

export default function MapLayerToggles({
  activeLayers,
  onToggle,
  className,
}: MapLayerTogglesProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      role="group"
      aria-label="Слои карты"
    >
      {MAP_LAYER_IDS.map((layer) => {
        const active = activeLayers.includes(layer);
        return (
          <button
            key={layer}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(layer)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand text-white shadow-sm"
                : "border border-gray-200 bg-white text-charcoal hover:border-sky/40 hover:bg-sky/5"
            )}
          >
            {LAYER_LABELS[layer]}
          </button>
        );
      })}
      <Link
        href="/tours"
        className="ml-auto hidden self-center text-xs font-medium text-sky hover:underline sm:inline"
      >
        Каталог туров →
      </Link>
    </div>
  );
}
