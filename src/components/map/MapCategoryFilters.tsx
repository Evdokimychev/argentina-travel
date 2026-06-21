"use client";

import {
  MAP_MARKER_KIND_LABELS,
  MAP_MARKER_KINDS,
  type MapMarkerKind,
} from "@/lib/map-types";
import { cn } from "@/lib/cn";

type Props = {
  activeKinds: MapMarkerKind[];
  onToggle: (kind: MapMarkerKind) => void;
  className?: string;
};

const VISIBLE_KINDS = MAP_MARKER_KINDS.filter((kind) => kind !== "route" && kind !== "region");

export default function MapCategoryFilters({ activeKinds, onToggle, className }: Props) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {VISIBLE_KINDS.map((kind) => {
        const active = activeKinds.includes(kind);
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onToggle(kind)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "border-sky/30 bg-sky text-white"
                : "border-gray-200 bg-white/95 text-charcoal hover:border-sky/30 hover:text-sky"
            )}
            aria-pressed={active}
          >
            {MAP_MARKER_KIND_LABELS[kind]}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onToggle("route")}
        className={cn(
          "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
          activeKinds.includes("route")
            ? "border-sky/30 bg-sky text-white"
            : "border-gray-200 bg-white/95 text-charcoal hover:border-sky/30 hover:text-sky"
        )}
        aria-pressed={activeKinds.includes("route")}
      >
        {MAP_MARKER_KIND_LABELS.route}
      </button>
    </div>
  );
}
