import maplibregl from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import {
  MAP_THEMATIC_LAYER_IDS,
  MAP_THEMATIC_LAYERS,
  type MapThematicLayerId,
  type MapThematicState,
} from "@/lib/map-thematic-layers";
import {
  loadThematicLayerGeoJson,
  getCachedThematicLayerGeoJson,
} from "@/lib/map-thematic-loader";
import { boundaryGeoJsonSource } from "@/lib/map-geodata-source";
import { thematicMapLayerIds, thematicSourceId } from "@/lib/map-thematic-maplibre-ids";

export type ThematicFeatureInfo = {
  layerId: MapThematicLayerId;
  name: string;
  description?: string;
  source?: string;
};

/** Порядок отрисовки: крупные полигоны внизу, линии и точки выше. */
export const THEMATIC_STACK_ORDER: MapThematicLayerId[] = [
  "biosphere",
  "climate_zones",
  "patagonia",
  "wine_regions",
  "beaches",
  "whale_watching",
  "glacier_zones",
  "popular_regions",
  "national_parks_area",
  "provinces",
  "ba_neighborhoods",
  "ba_recommended",
  "argentina_border",
  "ruta_40",
  "ruta_3",
  "panamericana",
  "scenic_routes",
  "patagonia_routes",
  "ski_resorts",
  "unesco",
];

const THEMATIC_LAYER_PREFIX = "thematic-";
/** Слои с hover по отдельным территориям — без общей заливки страны. */
const INTERACTIVE_FILL_LAYERS = THEMATIC_STACK_ORDER.filter(
  (id) => MAP_THEMATIC_LAYERS[id].kind === "fill" && id !== "argentina_border"
);

function outlinePaint(meta: (typeof MAP_THEMATIC_LAYERS)[MapThematicLayerId]) {
  if (meta.showOutline === false) return null;
  return {
    "line-color": meta.lineColor ?? "#64748b",
    "line-width": meta.lineWidth ?? 0.85,
    "line-opacity": 0.3,
    "line-blur": 0.4,
  };
}

function beforeLayerId(map: maplibregl.Map): string | undefined {
  if (map.getLayer("regions-fill")) return "regions-fill";
  if (map.getLayer("flight-arcs-line")) return "flight-arcs-line";
  return undefined;
}

export function installThematicLayerShells(map: maplibregl.Map): void {
  for (const layerId of THEMATIC_STACK_ORDER) {
    const sourceId = thematicSourceId(layerId);
    if (layerId !== "provinces" && !map.getSource(sourceId)) {
      map.addSource(
        sourceId,
        boundaryGeoJsonSource({ type: "FeatureCollection", features: [] })
      );
    }

    const meta = MAP_THEMATIC_LAYERS[layerId];
    const source = sourceId;
    const before = beforeLayerId(map);

    if (meta.kind === "fill") {
      const fillColor =
        layerId === "ba_neighborhoods"
          ? ([
              "case",
              [">=", ["to-number", ["get", "recommendedPriority"], 0], 2],
              "#86efac",
              [">=", ["to-number", ["get", "recommendedPriority"], 0], 1],
              "#c4b5fd",
              "#e2e8f0",
            ] as maplibregl.ExpressionSpecification)
          : layerId === "climate_zones" || layerId === "biosphere"
            ? ["coalesce", ["get", "fill"], meta.fillColor ?? "#94a3b8"]
            : meta.fillColor ?? "#94a3b8";

      map.addLayer(
        {
          id: `${THEMATIC_LAYER_PREFIX}${layerId}-fill`,
          type: "fill",
          source,
          layout: { visibility: "none" },
          paint: {
            "fill-color": fillColor as maplibregl.ExpressionSpecification | string,
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              Math.min((meta.fillOpacity ?? 0.1) + 0.05, 0.18),
              meta.fillOpacity ?? 0.1,
            ],
          },
        },
        before
      );

      const outline = outlinePaint(meta);
      if (outline) {
        map.addLayer(
          {
            id: `${THEMATIC_LAYER_PREFIX}${layerId}-outline`,
            type: "line",
            source,
            layout: { visibility: "none" },
            paint: outline,
          },
          before
        );
      }

      if (layerId === "ba_neighborhoods" || layerId === "ba_recommended" || layerId === "provinces") {
        map.addLayer(
          {
            id: `${THEMATIC_LAYER_PREFIX}${layerId}-label`,
            type: "symbol",
            source,
            minzoom: layerId.startsWith("ba_") ? 11.5 : 5,
            layout: {
              visibility: "none",
              "text-field": ["coalesce", ["get", "nameRu"], ["get", "name"]],
              "text-size": layerId.startsWith("ba_") ? 10.5 : 11,
              "text-font": ["Open Sans Bold"],
              "text-allow-overlap": false,
              "text-padding": 2,
            },
            paint: {
              "text-color": "#1e293b",
              "text-halo-color": "#ffffff",
              "text-halo-width": 1.5,
            },
          },
          before
        );
      }
    } else if (meta.kind === "line") {
      map.addLayer(
        {
          id: `${THEMATIC_LAYER_PREFIX}${layerId}-line`,
          type: "line",
          source,
          layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": meta.lineColor ?? "#dc2626",
            "line-width": meta.lineWidth ?? 2,
            "line-opacity": 0.78,
            ...(meta.lineDash ? { "line-dasharray": meta.lineDash } : {}),
          },
        },
        before
      );
    } else {
      map.addLayer(
        {
          id: `${THEMATIC_LAYER_PREFIX}${layerId}-circle`,
          type: "circle",
          source,
          layout: { visibility: "none" },
          paint: {
            "circle-color": meta.fillColor ?? "#6366f1",
            "circle-radius": 7,
            "circle-stroke-width": 2,
            "circle-stroke-color": meta.lineColor ?? "#ffffff",
            "circle-opacity": meta.fillOpacity ?? 0.9,
          },
        },
        before
      );
    }
  }
}

export async function ensureThematicLayerData(
  map: maplibregl.Map,
  layerId: MapThematicLayerId
): Promise<boolean> {
  const data = await loadThematicLayerGeoJson(layerId);
  if (!data?.features.length) return false;

  const sourceId = thematicSourceId(layerId);
  const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
  if (source) {
    source.setData(data);
    return true;
  }
  return false;
}

export function applyThematicLayerVisibility(
  map: maplibregl.Map,
  state: MapThematicState
): void {
  for (const layerId of MAP_THEMATIC_LAYER_IDS) {
    const visible = state[layerId];
    for (const mapLayerId of thematicMapLayerIds(layerId)) {
      if (map.getLayer(mapLayerId)) {
        map.setLayoutProperty(mapLayerId, "visibility", visible ? "visible" : "none");
      }
    }
  }
}

export function bindThematicLayerInteractions(
  map: maplibregl.Map,
  getThematicState: () => MapThematicState,
  onFeatureInfo?: (info: ThematicFeatureInfo | null) => void
): () => void {
  let hovered: { source: string; id: string | number } | null = null;

  const popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: "map-thematic-tooltip",
    offset: 12,
  });

  const interactiveLayerIds = [
    ...INTERACTIVE_FILL_LAYERS.flatMap((layerId) => [`${THEMATIC_LAYER_PREFIX}${layerId}-fill`]),
    `${THEMATIC_LAYER_PREFIX}unesco-circle`,
    `${THEMATIC_LAYER_PREFIX}ruta_40-line`,
    `${THEMATIC_LAYER_PREFIX}ruta_3-line`,
    `${THEMATIC_LAYER_PREFIX}panamericana-line`,
    `${THEMATIC_LAYER_PREFIX}scenic_routes-line`,
    `${THEMATIC_LAYER_PREFIX}patagonia_routes-line`,
    `${THEMATIC_LAYER_PREFIX}ski_resorts-circle`,
  ];

  const pickTopFeature = (point: maplibregl.Point) => {
    const state = getThematicState();
    for (let i = THEMATIC_STACK_ORDER.length - 1; i >= 0; i--) {
      const layerId = THEMATIC_STACK_ORDER[i]!;
      if (!state[layerId]) continue;

      const meta = MAP_THEMATIC_LAYERS[layerId];
      const mapLayerIds =
        meta.kind === "fill" && INTERACTIVE_FILL_LAYERS.includes(layerId)
          ? [`${THEMATIC_LAYER_PREFIX}${layerId}-fill`]
          : meta.kind === "line"
            ? [`${THEMATIC_LAYER_PREFIX}${layerId}-line`]
            : meta.kind === "circle"
              ? [`${THEMATIC_LAYER_PREFIX}${layerId}-circle`]
              : [];

      for (const mapLayerId of mapLayerIds) {
        if (!map.getLayer(mapLayerId)) continue;
        const hits = map.queryRenderedFeatures(point, { layers: [mapLayerId] });
        if (hits[0]) return hits[0];
      }
    }
    return undefined;
  };

  const handleMove = (event: maplibregl.MapMouseEvent) => {
    const top = pickTopFeature(event.point);

    if (hovered) {
      map.setFeatureState(
        { source: hovered.source, id: hovered.id },
        { hover: false }
      );
      hovered = null;
    }

    if (!top?.properties || top.id == null || !top.source) {
      map.getCanvas().style.cursor = "";
      popup.remove();
      onFeatureInfo?.(null);
      return;
    }

    const source = typeof top.source === "string" ? top.source : top.source;
    hovered = { source, id: top.id };
    map.setFeatureState({ source, id: top.id }, { hover: true });
    map.getCanvas().style.cursor = "pointer";

    const props = top.properties;
    const layerId = props.layerId as MapThematicLayerId;
    const name = String(props.nameRu ?? props.name ?? "Territorio");
    const description = props.description ?? props.category ?? props.comunaLabel;
    const audienceLabel = props.audienceLabel ? String(props.audienceLabel) : "";
    const priceLabel = props.priceLabel ? String(props.priceLabel) : "";
    const safetyNote = props.safetyNote ? String(props.safetyNote) : "";
    const sourceLabel = props.source ? String(props.source) : undefined;
    const metaLine = [priceLabel && `уровень: ${priceLabel}`, audienceLabel && audienceLabel]
      .filter(Boolean)
      .join(" · ");

    popup
      .setLngLat(event.lngLat)
      .setHTML(
        `<div style="font:600 12px/1.35 system-ui,sans-serif;color:#0f172a">${escapeHtml(name)}</div>` +
          (props.comunaLabel
            ? `<div style="font:400 10px/1.35 system-ui,sans-serif;color:#64748b;margin-top:1px">${escapeHtml(String(props.comunaLabel))}</div>`
            : "") +
          (description
            ? `<div style="font:400 11px/1.35 system-ui,sans-serif;color:#475569;margin-top:3px">${escapeHtml(String(description))}</div>`
            : "") +
          (metaLine
            ? `<div style="font:500 10px/1.35 system-ui,sans-serif;color:#0369a1;margin-top:3px">${escapeHtml(metaLine)}</div>`
            : "") +
          (safetyNote
            ? `<div style="font:400 10px/1.35 system-ui,sans-serif;color:#b45309;margin-top:3px">${escapeHtml(safetyNote)}</div>`
            : "") +
          (sourceLabel
            ? `<div style="font:400 9px/1.3 system-ui,sans-serif;color:#94a3b8;margin-top:4px">${escapeHtml(sourceLabel)}</div>`
            : "")
      )
      .addTo(map);

    onFeatureInfo?.({
      layerId,
      name,
      description: description ? String(description) : undefined,
      source: sourceLabel,
    });
  };

  const handleLeave = () => {
    if (hovered) {
      map.setFeatureState(
        { source: hovered.source, id: hovered.id },
        { hover: false }
      );
      hovered = null;
    }
    map.getCanvas().style.cursor = "";
    popup.remove();
    onFeatureInfo?.(null);
  };

  for (const layerId of interactiveLayerIds) {
    map.on("mousemove", layerId, handleMove);
    map.on("mouseleave", layerId, handleLeave);
  }

  return () => {
    for (const layerId of interactiveLayerIds) {
      map.off("mousemove", layerId, handleMove);
      map.off("mouseleave", layerId, handleLeave);
    }
    popup.remove();
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function setThematicSourceData(
  map: maplibregl.Map,
  layerId: MapThematicLayerId,
  data: FeatureCollection
): void {
  const sourceId = thematicSourceId(layerId);
  const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
  if (source) source.setData(data);
}

export { getCachedThematicLayerGeoJson };
