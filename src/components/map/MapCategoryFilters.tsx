"use client";

import {
  MAP_MARKER_KIND_LABELS,
  MAP_MARKER_KINDS,
  type MapMarkerKind,
} from "@/lib/map-types";
import { MAP_KIND_COLORS } from "@/lib/map-kind-colors";
import MapKindIcon from "@/components/map/MapKindIcon";
import { cn } from "@/lib/cn";

type Props = {
  activeKinds: MapMarkerKind[];
  onToggle: (kind: MapMarkerKind) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onReset: () => void;
  className?: string;
  compact?: boolean;
};

const VISIBLE_KINDS = MAP_MARKER_KINDS.filter((kind) => kind !== "route" && kind !== "region");

export default function MapCategoryFilters({
  activeKinds,
  onToggle,
  onSelectAll,
  onClearAll,
  onReset,
  className,
  compact = false,
}: Props) {
  const allActive = VISIBLE_KINDS.every((kind) => activeKinds.includes(kind)) && activeKinds.includes("route");
  const noneActive = activeKinds.length === 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onSelectAll}
          disabled={allActive}
          className="rounded-full border border-gray-200/90 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-charcoal transition hover:border-sky/30 hover:text-sky disabled:opacity-40"
        >
          Все метки
        </button>
        <button
          type="button"
          onClick={onClearAll}
          disabled={noneActive}
          className="rounded-full border border-gray-200/90 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-charcoal transition hover:border-sky/30 hover:text-sky disabled:opacity-40"
        >
          Скрыть все
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-gray-200/90 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate transition hover:border-sky/30 hover:text-sky"
        >
          По умолчанию
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {VISIBLE_KINDS.map((kind) => {
          const active = activeKinds.includes(kind);
          const color = MAP_KIND_COLORS[kind];
          return (
            <button
              key={kind}
              type="button"
              onClick={() => onToggle(kind)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border font-semibold transition",
                compact ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
                active
                  ? "border-transparent text-white shadow-sm"
                  : "border-gray-200/90 bg-white/90 text-charcoal hover:border-sky/30"
              )}
              style={active ? { backgroundColor: color } : undefined}
              aria-pressed={active}
            >
              <MapKindIcon
                kind={kind}
                className={cn("h-3.5 w-3.5", active ? "text-white" : "")}
                style={!active ? { color } : undefined}
              />
              {MAP_MARKER_KIND_LABELS[kind]}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onToggle("route")}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border font-semibold transition",
            compact ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
            activeKinds.includes("route")
              ? "border-transparent text-white shadow-sm"
              : "border-gray-200/90 bg-white/90 text-charcoal hover:border-sky/30"
          )}
          style={activeKinds.includes("route") ? { backgroundColor: MAP_KIND_COLORS.route } : undefined}
          aria-pressed={activeKinds.includes("route")}
        >
          <MapKindIcon
            kind="route"
            className={cn("h-3.5 w-3.5", activeKinds.includes("route") ? "text-white" : "")}
            style={!activeKinds.includes("route") ? { color: MAP_KIND_COLORS.route } : undefined}
          />
          {MAP_MARKER_KIND_LABELS.route}
        </button>
      </div>
    </div>
  );
}
