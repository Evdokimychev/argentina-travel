"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import { boundaryGeoJsonSource } from "@/lib/map-geodata-source";
import type { MapMarkerKind, MapObject, MapRouteItem } from "@/lib/map-types";
import { MAP_KIND_COLORS } from "@/lib/map-kind-colors";
import {
  MAP_BASEMAP_THEMES,
  MAP_BASEMAP_THEME_IDS,
  type MapBasemapThemeId,
} from "@/lib/map-basemap-themes";
import {
  MAP_DEM_TILES,
  MAP_LABELS_OVERLAY_TILES,
  MAP_TOPO_OVERLAY_TILES,
  type MapOverlayState,
} from "@/lib/map-overlay-layers";
import {
  applyThematicLayerVisibility,
  bindThematicLayerInteractions,
  ensureThematicLayerData,
  installThematicLayerShells,
} from "@/lib/map-thematic-maplibre";
import { MAP_THEMATIC_LAYER_IDS, type MapThematicLayerId, type MapThematicState } from "@/lib/map-thematic-layers";
import { registerMapMarkerImages } from "@/lib/map-marker-icons";
import { cn } from "@/lib/cn";
import "maplibre-gl/dist/maplibre-gl.css";

import type { MapViewConfig } from "@/lib/map-view-config";
import { ARGENTINA_MAP_VIEW } from "@/lib/map-view-config";

/**
 * MapLibre symbol layers need a glyph source; raster-only styles omit it by default.
 * CARTO hosts the full Open Sans family (demotiles lacks "Open Sans Bold" → 404
 * breaks the whole GeoJSON source, and markers disappear).
 */
const MAP_STYLE_GLYPHS = "https://basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf";
const MAP_CLUSTER_TEXT_FONT = ["Open Sans Bold"] as const;

function clusterCountLabel(): maplibregl.ExpressionSpecification {
  return [
    "case",
    [">=", ["get", "point_count"], 1000],
    ["concat", ["to-string", ["/", ["get", "point_count"], 1000]], "k"],
    ["to-string", ["get", "point_count"]],
  ];
}

function createMapStyle(backgroundColor: string): maplibregl.StyleSpecification {
  return {
    version: 8,
    glyphs: MAP_STYLE_GLYPHS,
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": backgroundColor },
      },
    ],
  };
}

type Props = {
  objects: MapObject[];
  routes: MapRouteItem[];
  activeKinds: MapMarkerKind[];
  selectedId: string | null;
  theme: MapBasemapThemeId;
  overlays: MapOverlayState;
  thematic: MapThematicState;
  enableThematicInteractions?: boolean;
  onThematicLayerLoadState?: (layerId: MapThematicLayerId, loading: boolean) => void;
  onSelect: (object: MapObject | null) => void;
  selectedFlightDestinationIata?: string | null;
  onSelectFlightDestination?: (iata: string | null) => void;
  userLocation?: {
    latitude: number;
    longitude: number;
    requestId: number;
  } | null;
  className?: string;
  /** Переопределение центра/зума — для встраиваемых карт (районы CABA и т.д.) */
  view?: MapViewConfig;
};

function objectsToGeoJson(objects: MapObject[], selectedId: string | null): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: objects.map((obj) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [obj.longitude, obj.latitude] },
      properties: {
        id: obj.id,
        kind: obj.kind,
        title: obj.title,
        color: MAP_KIND_COLORS[obj.kind] ?? "#2563eb",
        selected: obj.id === selectedId ? 1 : 0,
        featured: obj.featured ? 1 : 0,
        importance: obj.importance ?? 0,
        minZoom: obj.minZoom ?? (obj.featured ? 3 : 7),
      },
    })),
  };
}

function routesToGeoJson(routes: MapRouteItem[]): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: routes.map((route) => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: route.points.map((p) => [p.lng, p.lat]),
      },
      properties: {
        slug: route.slug,
        title: route.title,
      },
    })),
  };
}

/** Дуга (квадратичная кривая Безье) между двумя точками для линий перелётов. */
function buildArcCoordinates(
  from: [number, number],
  to: [number, number],
  segments = 32
): [number, number][] {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  // Перпендикулярное смещение контрольной точки — дуга «выгибается» вбок
  const dx = x2 - x1;
  const dy = y2 - y1;
  const ctrlX = midX - dy * 0.18;
  const ctrlY = midY + dx * 0.18;

  const coords: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const mt = 1 - t;
    coords.push([
      mt * mt * x1 + 2 * mt * t * ctrlX + t * t * x2,
      mt * mt * y1 + 2 * mt * t * ctrlY + t * t * y2,
    ]);
  }
  return coords;
}

function flightArcsToGeoJson(
  selected: MapObject | undefined,
  selectedDestinationIata: string | null = null,
): FeatureCollection<LineString> {
  if (!selected || selected.kind !== "airport" || !selected.flightDestinations?.length) {
    return { type: "FeatureCollection", features: [] };
  }
  return {
    type: "FeatureCollection",
    features: selected.flightDestinations.map((dest) => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: buildArcCoordinates(
          [selected.longitude, selected.latitude],
          [dest.longitude, dest.latitude]
        ),
      },
      properties: {
        iata: dest.iata,
        city: dest.city,
        selected: dest.iata === selectedDestinationIata ? 1 : 0,
        dimmed: selectedDestinationIata && dest.iata !== selectedDestinationIata ? 1 : 0,
      },
    })),
  };
}

export default function ArgentinaMapLibreCanvas({
  objects,
  routes,
  activeKinds,
  selectedId,
  theme,
  overlays,
  thematic,
  enableThematicInteractions = true,
  onThematicLayerLoadState,
  onSelect,
  selectedFlightDestinationIata = null,
  onSelectFlightDestination,
  userLocation = null,
  className,
  view = ARGENTINA_MAP_VIEW,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  const onSelectFlightDestinationRef = useRef(onSelectFlightDestination);
  const viewRef = useRef(view);
  const objectsRef = useRef(objects);
  const routesRef = useRef(routes);
  const activeKindsRef = useRef(activeKinds);
  const selectedIdRef = useRef(selectedId);
  const selectedFlightDestinationIataRef = useRef(selectedFlightDestinationIata);
  const themeRef = useRef(theme);
  const overlaysRef = useRef(overlays);
  const thematicRef = useRef(thematic);
  const thematicCleanupRef = useRef<(() => void) | null>(null);
  const loadedThematicRef = useRef<Set<MapThematicLayerId>>(new Set());
  const loadingThematicRef = useRef<Set<MapThematicLayerId>>(new Set());
  const onThematicLayerLoadStateRef = useRef(onThematicLayerLoadState);
  const terrainControlRef = useRef<maplibregl.TerrainControl | null>(null);
  const didFitBoundsRef = useRef(false);
  const layersReadyRef = useRef(false);
  const [mapLayersReady, setMapLayersReady] = useState(false);
  const lastObjectsKeyRef = useRef("");
  const lastRoutesKeyRef = useRef<string | null>(null);
  const lastArcsKeyRef = useRef<string | null>(null);

  onSelectRef.current = onSelect;
  onSelectFlightDestinationRef.current = onSelectFlightDestination;
  objectsRef.current = objects;
  routesRef.current = routes;
  activeKindsRef.current = activeKinds;
  selectedIdRef.current = selectedId;
  selectedFlightDestinationIataRef.current = selectedFlightDestinationIata;
  themeRef.current = theme;
  overlaysRef.current = overlays;
  thematicRef.current = thematic;
  onThematicLayerLoadStateRef.current = onThematicLayerLoadState;
  viewRef.current = view;

  const applyLayerData = useCallback((map: maplibregl.Map) => {
    const objectsSource = map.getSource("objects") as maplibregl.GeoJSONSource | undefined;
    const routesSource = map.getSource("routes") as maplibregl.GeoJSONSource | undefined;
    if (!objectsSource || !routesSource) return false;

    // setData только при реальном изменении данных: повторный вызов сразу после
    // addSource ломает clustered-источник MapLibre (worker теряет данные).
    const objectsKey = objectsRef.current
      .map((obj) => `${obj.id}${obj.id === selectedIdRef.current ? "*" : ""}`)
      .sort()
      .join("|");
    if (objectsKey !== lastObjectsKeyRef.current) {
      const isNewObjectSet =
        objectsKey.replace(/\*/g, "") !== lastObjectsKeyRef.current.replace(/\*/g, "");
      lastObjectsKeyRef.current = objectsKey;
      objectsSource.setData(objectsToGeoJson(objectsRef.current, selectedIdRef.current));
      if (isNewObjectSet) didFitBoundsRef.current = false;
    }

    const routesKey = routesRef.current.map((r) => r.slug).join("|");
    if (routesKey !== lastRoutesKeyRef.current) {
      lastRoutesKeyRef.current = routesKey;
      routesSource.setData(routesToGeoJson(routesRef.current));
    }

    const flightArcsSource = map.getSource("flight-arcs") as maplibregl.GeoJSONSource | undefined;
    if (flightArcsSource) {
      const selectedObject = objectsRef.current.find((obj) => obj.id === selectedIdRef.current);
      const arcsKey = selectedObject?.kind === "airport"
        ? `${selectedObject.id}:${selectedFlightDestinationIataRef.current ?? ""}`
        : "";
      if (arcsKey !== lastArcsKeyRef.current) {
        lastArcsKeyRef.current = arcsKey;
        flightArcsSource.setData(
          flightArcsToGeoJson(selectedObject, selectedFlightDestinationIataRef.current),
        );
      }
    }

    map.setPaintProperty(
      "regions-fill",
      "fill-opacity",
      activeKindsRef.current.includes("region") ? 0.28 : 0
    );
    map.setPaintProperty(
      "regions-outline",
      "line-opacity",
      activeKindsRef.current.includes("region") ? 0.55 : 0
    );
    map.setPaintProperty(
      "routes-line",
      "line-opacity",
      activeKindsRef.current.includes("route") ? 0.8 : 0
    );

    if (
      !viewRef.current.lockView &&
      !didFitBoundsRef.current &&
      objectsRef.current.length > 0 &&
      !selectedIdRef.current
    ) {
      const bounds = new maplibregl.LngLatBounds();
      for (const obj of objectsRef.current) {
        bounds.extend([obj.longitude, obj.latitude]);
      }
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: { top: 120, bottom: 48, left: 48, right: 48 },
          maxZoom: 5.5,
          duration: objectsRef.current.length > 1 ? 800 : 0,
        });
        didFitBoundsRef.current = true;
      }
    }

    return true;
  }, []);

  const applyBasemapTheme = useCallback((map: maplibregl.Map, themeId: MapBasemapThemeId) => {
    for (const id of MAP_BASEMAP_THEME_IDS) {
      if (map.getLayer(`basemap-${id}`)) {
        map.setLayoutProperty(`basemap-${id}`, "visibility", id === themeId ? "visible" : "none");
      }
    }
    if (containerRef.current) {
      containerRef.current.style.backgroundColor = MAP_BASEMAP_THEMES[themeId].backgroundColor;
    }
  }, []);

  const applyMapOverlays = useCallback((map: maplibregl.Map, overlayState: MapOverlayState) => {
    const setVisibility = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
      }
    };

    setVisibility("overlay-topo", overlayState.contours);
    setVisibility("overlay-hillshade", overlayState.hillshade);
    setVisibility("overlay-labels", overlayState.labels);

    if (overlayState.terrain3d) {
      map.setTerrain({ source: "map-dem", exaggeration: 1.35 });
      if (map.getPitch() < 24) {
        map.easeTo({ pitch: 52, duration: 700 });
      }
      if (!terrainControlRef.current) {
        terrainControlRef.current = new maplibregl.TerrainControl({
          source: "map-dem",
          exaggeration: 1.35,
        });
        map.addControl(terrainControlRef.current, "top-right");
      }
    } else {
      map.setTerrain(null);
      if (terrainControlRef.current) {
        map.removeControl(terrainControlRef.current);
        terrainControlRef.current = null;
      }
    }
  }, []);

  const syncActiveThematicLayers = useCallback(async (map: maplibregl.Map, state: MapThematicState) => {
    const pending = MAP_THEMATIC_LAYER_IDS.filter(
      (layerId) =>
        state[layerId] &&
        !loadedThematicRef.current.has(layerId) &&
        !loadingThematicRef.current.has(layerId),
    );
    await Promise.all(
      pending.map(async (layerId) => {
        loadingThematicRef.current.add(layerId);
        onThematicLayerLoadStateRef.current?.(layerId, true);
        try {
          const ok = await ensureThematicLayerData(map, layerId);
          if (ok) loadedThematicRef.current.add(layerId);
        } catch {
          // Слой остаётся выключенным; повторное включение даст пользователю
          // возможность загрузить его снова после временной сетевой ошибки.
        } finally {
          loadingThematicRef.current.delete(layerId);
          onThematicLayerLoadStateRef.current?.(layerId, false);
        }
      }),
    );
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialTheme = themeRef.current;
    const loadedThematic = loadedThematicRef.current;
    const loadingThematic = loadingThematicRef.current;
    containerRef.current.style.backgroundColor = MAP_BASEMAP_THEMES[initialTheme].backgroundColor;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createMapStyle(MAP_BASEMAP_THEMES[initialTheme].backgroundColor),
      center: viewRef.current.center,
      zoom: viewRef.current.zoom,
      minZoom: viewRef.current.minZoom ?? 3,
      maxZoom: viewRef.current.maxZoom ?? 16,
      maxBounds: viewRef.current.maxBounds,
      maxPitch: 85,
      attributionControl: { compact: true },
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
      "top-right"
    );
    map.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-right");

    const bindClusterInteractions = () => {
      const handleClusterClick = (event: maplibregl.MapLayerMouseEvent) => {
        const features = map.queryRenderedFeatures(event.point, {
          layers: ["clusters", "cluster-count"],
        });
        const cluster = features[0];
        if (!cluster?.geometry || cluster.geometry.type !== "Point") return;
        const source = map.getSource("objects") as maplibregl.GeoJSONSource;
        const clusterId = cluster.properties?.cluster_id;
        if (clusterId == null) return;
        void source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const [lng, lat] = (cluster.geometry as Point).coordinates;
          map.easeTo({ center: [lng, lat], zoom: Math.min(zoom + 0.5, 14) });
        });
      };

      map.on("click", "clusters", handleClusterClick);
      map.on("click", "cluster-count", handleClusterClick);

      for (const layerId of ["clusters", "cluster-count"]) {
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
      }
    };

    const hoverPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 18,
      className: "map-hover-tooltip",
    });

    const bindMarkerInteractions = (layerId: string) => {
      map.on("click", layerId, (event) => {
        const feature = event.features?.[0] as Feature<Point> | undefined;
        const id = feature?.properties?.id as string | undefined;
        if (!id) return;
        const obj = objectsRef.current.find((item) => item.id === id) ?? null;
        onSelectRef.current(obj);
      });
      map.on("mouseenter", layerId, (event) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = event.features?.[0] as Feature<Point> | undefined;
        const title = feature?.properties?.title as string | undefined;
        if (!title || feature?.geometry?.type !== "Point") return;
        const [lng, lat] = feature.geometry.coordinates;
        hoverPopup
          .setLngLat([lng, lat])
          .setHTML(
            `<span style="font: 600 12px/1.3 system-ui, sans-serif; color: #0f172a;">${title
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")}</span>`
          )
          .addTo(map);
      });
      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
        hoverPopup.remove();
      });
    };

    // Крупные ориентиры видны на масштабе страны, локальные места раскрываются
    // при приближении. Выбранный объект остаётся видимым независимо от масштаба.
    const syncSemanticMarkerVisibility = () => {
      const zoom = map.getZoom();
      const visibleAtZoom: maplibregl.FilterSpecification = [
        "all",
        ["!", ["has", "point_count"]],
        [
          "any",
          ["==", ["get", "selected"], 1],
          ["<=", ["get", "minZoom"], zoom],
        ],
      ];
      if (map.getLayer("object-markers-dot")) {
        map.setFilter("object-markers-dot", visibleAtZoom);
      }
      if (map.getLayer("unclustered-marker")) {
        map.setFilter("unclustered-marker", visibleAtZoom);
      }
      if (map.getLayer("featured-object-labels")) {
        map.setFilter("featured-object-labels", [
          "all",
          ["!", ["has", "point_count"]],
          ["==", ["get", "featured"], 1],
          [
            "any",
            ["==", ["get", "selected"], 1],
            ["<=", ["get", "minZoom"], zoom],
          ],
        ]);
      }
    };

    map.on("zoomend", syncSemanticMarkerVisibility);

    map.on("load", () => {
      for (const themeId of MAP_BASEMAP_THEME_IDS) {
        const themeConfig = MAP_BASEMAP_THEMES[themeId];
        map.addSource(`basemap-${themeId}`, {
          type: "raster",
          tiles: themeConfig.tiles,
          tileSize: 256,
          attribution: themeConfig.attribution,
        });
        map.addLayer({
          id: `basemap-${themeId}`,
          type: "raster",
          source: `basemap-${themeId}`,
          layout: { visibility: themeId === initialTheme ? "visible" : "none" },
        });
      }

      map.addSource("map-dem", {
        type: "raster-dem",
        tiles: [...MAP_DEM_TILES],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 15,
      });

      map.addSource("overlay-topo", {
        type: "raster",
        tiles: [...MAP_TOPO_OVERLAY_TILES],
        tileSize: 256,
        attribution: "© OpenTopoMap · OpenStreetMap",
      });
      map.addLayer({
        id: "overlay-topo",
        type: "raster",
        source: "overlay-topo",
        layout: { visibility: "none" },
        paint: { "raster-opacity": 0.42 },
      });

      map.addLayer({
        id: "overlay-hillshade",
        type: "hillshade",
        source: "map-dem",
        layout: { visibility: "none" },
        paint: {
          "hillshade-exaggeration": 0.45,
          "hillshade-shadow-color": "#334155",
          "hillshade-highlight-color": "#f8fafc",
          "hillshade-illumination-direction": 315,
        },
      });

      map.addSource("overlay-labels", {
        type: "raster",
        tiles: [...MAP_LABELS_OVERLAY_TILES],
        tileSize: 256,
        attribution: "© CARTO · OpenStreetMap",
      });

      applyMapOverlays(map, overlaysRef.current);

      map.addSource(
        "regions",
        boundaryGeoJsonSource({ type: "FeatureCollection", features: [] })
      );
      // Detailed province boundaries weigh about 14 MB. Keep the public map
      // responsive and let ensureThematicLayerData load them only after the
      // visitor explicitly enables a province-derived thematic layer.
      map.addLayer({
        id: "regions-fill",
        type: "fill",
        source: "regions",
        paint: { "fill-color": "#cbd5e1", "fill-opacity": 0 },
      });
      map.addLayer({
        id: "regions-outline",
        type: "line",
        source: "regions",
        paint: { "line-color": "#64748b", "line-width": 1.2, "line-opacity": 0 },
      });

      installThematicLayerShells(map);
      applyThematicLayerVisibility(map, thematicRef.current);
      if (enableThematicInteractions) {
        thematicCleanupRef.current = bindThematicLayerInteractions(map, () => thematicRef.current);
      }
      void syncActiveThematicLayers(map, thematicRef.current);

      map.addSource("flight-arcs", { type: "geojson", data: flightArcsToGeoJson(undefined) });
      map.addLayer({
        id: "flight-arcs-line",
        type: "line",
        source: "flight-arcs",
        paint: {
          "line-color": ["case", ["==", ["get", "selected"], 1], "#0369a1", "#0ea5e9"],
          "line-width": ["case", ["==", ["get", "selected"], 1], 4, 2],
          "line-opacity": [
            "case",
            ["==", ["get", "selected"], 1],
            1,
            ["==", ["get", "dimmed"], 1],
            0.25,
            0.75,
          ],
          "line-dasharray": [1.5, 1.5],
        },
        layout: { "line-cap": "round" },
      });
      map.on("click", "flight-arcs-line", (event) => {
        const iata = event.features?.[0]?.properties?.iata;
        if (typeof iata === "string") onSelectFlightDestinationRef.current?.(iata);
      });
      map.on("mouseenter", "flight-arcs-line", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "flight-arcs-line", () => {
        map.getCanvas().style.cursor = "";
      });

      map.addSource("routes", { type: "geojson", data: routesToGeoJson([]) });
      map.addLayer({
        id: "routes-line",
        type: "line",
        source: "routes",
        paint: {
          "line-color": MAP_KIND_COLORS.route,
          "line-width": 3.5,
          "line-opacity": 0,
        },
        layout: { "line-cap": "round", "line-join": "round" },
      });

      map.addLayer({
        id: "overlay-labels",
        type: "raster",
        source: "overlay-labels",
        layout: { visibility: "none" },
        paint: { "raster-opacity": 0.92 },
      });

      // Данные кладём сразу при создании источника; applyLayerData не будет
      // дублировать setData благодаря lastObjectsKeyRef (см. комментарий там)
      lastObjectsKeyRef.current = objectsRef.current
        .map((obj) => `${obj.id}${obj.id === selectedIdRef.current ? "*" : ""}`)
        .sort()
        .join("|");
      map.addSource("objects", {
        type: "geojson",
        data: objectsToGeoJson(objectsRef.current, selectedIdRef.current),
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 28,
        clusterMinPoints: 3,
      });

      map.addLayer({
        id: "object-markers-dot",
        type: "circle",
        source: "objects",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": [
            "case",
            ["==", ["get", "selected"], 1],
            12,
            ["==", ["get", "featured"], 1],
            9,
            6.5,
          ],
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.92,
        },
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "objects",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#475569",
            8,
            "#334155",
            20,
            "#1e293b",
          ],
          "circle-radius": ["step", ["get", "point_count"], 16, 8, 20, 20, 26],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.96,
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "objects",
        filter: ["has", "point_count"],
        layout: {
          "text-field": clusterCountLabel(),
          "text-font": [...MAP_CLUSTER_TEXT_FONT],
          "text-size": ["step", ["get", "point_count"], 12, 10, 13, 25, 14],
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(15, 23, 42, 0.35)",
          "text-halo-width": 1.25,
        },
      });

      bindClusterInteractions();
      bindMarkerInteractions("object-markers-dot");
      syncSemanticMarkerVisibility();
      layersReadyRef.current = true;
      setMapLayersReady(true);
      applyLayerData(map);

      void registerMapMarkerImages(map)
        .then(() => {
          if (map.getLayer("unclustered-marker")) return;
          map.addLayer({
            id: "unclustered-marker",
            type: "symbol",
            source: "objects",
            filter: ["!", ["has", "point_count"]],
            layout: {
              "icon-image": [
                "concat",
                "marker-",
                ["get", "kind"],
                ["case", ["==", ["get", "selected"], 1], "-selected", ""],
              ],
              "icon-size": [
                "case",
                ["==", ["get", "selected"], 1],
                0.86,
                ["==", ["get", "featured"], 1],
                0.76,
                0.6,
              ],
              "icon-allow-overlap": true,
              "icon-anchor": "bottom",
              "icon-offset": [0, 4],
              "symbol-sort-key": ["get", "importance"],
            },
          });
          bindMarkerInteractions("unclustered-marker");
          map.addLayer({
            id: "featured-object-labels",
            type: "symbol",
            source: "objects",
            minzoom: 4.5,
            filter: [
              "all",
              ["!", ["has", "point_count"]],
              ["==", ["get", "featured"], 1],
            ],
            layout: {
              "text-field": ["get", "title"],
              "text-font": [...MAP_CLUSTER_TEXT_FONT],
              "text-size": 11,
              "text-offset": [0, 1.15],
              "text-anchor": "top",
              "text-max-width": 12,
              "text-allow-overlap": false,
              "symbol-sort-key": ["get", "importance"],
            },
            paint: {
              "text-color": "#0f172a",
              "text-halo-color": "rgba(255,255,255,0.96)",
              "text-halo-width": 2,
            },
          });
          bindMarkerInteractions("featured-object-labels");
          syncSemanticMarkerVisibility();
          if (map.getLayer("object-markers-dot")) {
            map.setPaintProperty("object-markers-dot", "circle-opacity", 0);
          }
          applyLayerData(map);
        })
        .catch(() => {
          applyLayerData(map);
        });
    });

    mapRef.current = map;
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__argMap = map;
    }

    return () => {
      userLocationMarkerRef.current?.remove();
      userLocationMarkerRef.current = null;
      thematicCleanupRef.current?.();
      thematicCleanupRef.current = null;
      loadedThematic.clear();
      loadingThematic.clear();
      map.remove();
      mapRef.current = null;
      layersReadyRef.current = false;
      setMapLayersReady(false);
      lastObjectsKeyRef.current = "";
      lastRoutesKeyRef.current = null;
      lastArcsKeyRef.current = null;
      didFitBoundsRef.current = false;
    };
  }, [applyLayerData, applyMapOverlays, enableThematicInteractions, syncActiveThematicLayers]);

  useLayoutEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLayersReady) return;
    applyLayerData(map);
  }, [objects, routes, activeKinds, selectedId, mapLayersReady, applyLayerData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReadyRef.current) return;
    applyBasemapTheme(map, theme);
  }, [theme, applyBasemapTheme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReadyRef.current) return;
    applyMapOverlays(map, overlays);
  }, [overlays, applyMapOverlays]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReadyRef.current) return;
    applyThematicLayerVisibility(map, thematic);
    void syncActiveThematicLayers(map, thematic);
  }, [thematic, syncActiveThematicLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    userLocationMarkerRef.current?.remove();
    const marker = new maplibregl.Marker({ color: "#d9533f", scale: 0.85 })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(map);
    marker.getElement().setAttribute("aria-label", "Ваше местоположение");
    marker.getElement().setAttribute("title", "Ваше местоположение");
    userLocationMarkerRef.current = marker;
    map.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: Math.max(map.getZoom(), 11),
      essential: true,
    });
  }, [userLocation, mapLayersReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const obj = objects.find((item) => item.id === selectedId);
    if (!obj) return;

    if (obj.kind === "airport" && obj.flightDestinations?.length) {
      const selectedDestination = selectedFlightDestinationIata
        ? obj.flightDestinations.find((destination) => destination.iata === selectedFlightDestinationIata)
        : null;
      // После выбора линии показываем пару аэропортов; до выбора — всю сеть из точки.
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([obj.longitude, obj.latitude]);
      for (const dest of selectedDestination ? [selectedDestination] : obj.flightDestinations) {
        bounds.extend([dest.longitude, dest.latitude]);
      }
      map.fitBounds(bounds, {
        padding: { top: 140, bottom: 80, left: 64, right: 64 },
        maxZoom: 8,
        duration: 900,
      });
      return;
    }

    map.flyTo({
      center: [obj.longitude, obj.latitude],
      zoom: Math.max(map.getZoom(), 9),
      essential: true,
    });
  }, [selectedId, selectedFlightDestinationIata, objects]);

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full", className)}
      role="region"
      aria-label="Интерактивная карта Аргентины"
    />
  );
}
