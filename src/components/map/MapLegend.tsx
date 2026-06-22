"use client";

import { MAP_MARKER_KIND_LABELS, type MapMarkerKind } from "@/lib/map-types";
import { MAP_KIND_COLORS } from "@/lib/map-kind-colors";
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
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate">Обозначения</p>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
        {LEGEND_KINDS.map((kind) => {
          const active = activeKinds.includes(kind);
          return (
            <li key={kind} className="flex items-center gap-1.5 text-[11px] text-charcoal">
              <span
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white",
                  !active && "opacity-40"
                )}
                style={{ backgroundColor: MAP_KIND_COLORS[kind] }}
                aria-hidden
              />
              <span className={cn(!active && "text-slate")}>{MAP_MARKER_KIND_LABELS[kind]}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
