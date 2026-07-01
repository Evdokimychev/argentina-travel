"use client";

import { MAP_MARKER_KIND_LABELS, type MapMarkerKind } from "@/lib/map-types";
import { MAP_KIND_COLORS } from "@/lib/map-kind-colors";
import MapKindIcon from "@/components/map/MapKindIcon";
import { cn } from "@/lib/cn";

const LEGEND_KINDS: MapMarkerKind[] = [
  "city",
  "national_park",
  "attraction",
  "tour",
  "airport",
  "transport",
  "route",
];

type Props = {
  activeKinds: MapMarkerKind[];
  className?: string;
};

export default function MapLegend({ activeKinds, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-100/80 bg-white/90 px-3 py-2.5 shadow-sm backdrop-blur-md",
        className
      )}
      aria-label="Легенда карты"
    >
      <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
        {LEGEND_KINDS.map((kind) => {
          const active = activeKinds.includes(kind);
          const color = MAP_KIND_COLORS[kind];
          return (
            <li key={kind} className="flex items-center gap-1.5 text-[11px] text-charcoal">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-md ring-1 ring-white",
                  !active && "opacity-40"
                )}
                style={{ backgroundColor: `${color}22`, color }}
                aria-hidden
              >
                <MapKindIcon kind={kind} className="h-3 w-3" style={{ color }} />
              </span>
              <span className={cn(!active && "text-slate")}>{MAP_MARKER_KIND_LABELS[kind]}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
