"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
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
import { registerMapMarkerImages } from "@/lib/map-marker-icons";
import { ARGENTINA_REGIONS_GEOJSON } from "@/data/argentina-regions";
import { cn } from "@/lib/cn";
import "maplibre-gl/dist/maplibre-gl.css";

const ARGENTINA_CENTER: [number, number] = [-64.2, -38.5];
const ARGENTINA_ZOOM = 4;
/** Below this count markers are shown individually; above — clustered. */
const MAP_CLUSTER_MIN_OBJECTS = 25;

/** MapLibre symbol layers need a glyph source; raster-only styles omit it by default. */
const MAP_STYLE_GLYPHS = "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf";
const MAP_CLUSTER_TEXT_FONT = ["Open Sans Bold", "Arial Unicode MS Bold"] as const;

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
  onSelect: (object: MapObject | null) => void;
  className?: string;
};

function objectsToGeoJson(objects: MapObject[], selectedId: string | null): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: objects.map((obj) => ({
      type: "Feature",
      id: obj.id,
      geometry: { type: "Point", coordinates: [obj.longitude, obj.latitude] },
      properties: {
        id: obj.id,
        kind: obj.kind,
        title: obj.title,
        color: MAP_KIND_COLORS[obj.kind] ?? "#2563eb",
        selected: obj.id === selectedId ? 1 : 0,
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

export default function ArgentinaMapLibreCanvas({
  objects,
  routes,
  activeKinds,
  selectedId,
  theme,
  overlays,
  onSelect,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const objectsRef = useRef(objects);
  const routesRef = useRef(routes);
  const activeKindsRef = useRef(activeKinds);
  const selectedIdRef = useRef(selectedId);
  const themeRef = useRef(theme);
  const overlaysRef = useRef(overlays);
  const terrainControlRef = useRef<maplibregl.TerrainControl | null>(null);
  const didFitBoundsRef = useRef(false);
  const layersReadyRef = useRef(false);
  const [mapLayersReady, setMapLayersReady] = useState(false);
  const lastObjectsKeyRef = useRef("");
  const clusterModeRef = useRef<boolean | null>(null);

  onSelectRef.current = onSelect;
  objectsRef.current = objects;
  routesRef.current = routes;
  activeKindsRef.current = activeKinds;
  selectedIdRef.current = selectedId;
  themeRef.current = theme;
  overlaysRef.current = overlays;

  const applyLayerData = useCallback((map: maplibregl.Map) => {
    const routesSource = map.getSource("routes") as maplibregl.GeoJSONSource | undefined;
    if (!routesSource) return false;

    const shouldCluster = objectsRef.current.length > MAP_CLUSTER_MIN_OBJECTS;
    if (clusterModeRef.current !== shouldCluster) {
      const markerLayers = ["unclustered-marker", "object-markers-dot", "cluster-count", "clusters"];
      for (const layerId of markerLayers) {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      }
      if (map.getSource("objects")) map.removeSource("objects");

      map.addSource("objects", {
        type: "geojson",
        data: objectsToGeoJson(objectsRef.current, selectedIdRef.current),
        ...(shouldCluster
          ? { cluster: true, clusterMaxZoom: 13, clusterRadius: 28 }
          : { cluster: false }),
      });

      if (shouldCluster) {
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "objects",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#7dd3fc",
              8,
              "#38bdf8",
              20,
              "#0284c7",
            ],
            "circle-radius": ["step", ["get", "point_count"], 14, 8, 18, 20, 24],
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.92,
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
            "text-color": "#0f172a",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1.75,
          },
        });
      }

      map.addLayer({
        id: "object-markers-dot",
        type: "circle",
        source: "objects",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": ["case", ["==", ["get", "selected"], 1], 10, 7],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.95,
        },
      });

      if (map.getLayer("unclustered-marker")) {
        map.setPaintProperty("object-markers-dot", "circle-opacity", 0);
      }

      clusterModeRef.current = shouldCluster;
    } else {
      const objectsSource = map.getSource("objects") as maplibregl.GeoJSONSource | undefined;
      if (!objectsSource) return false;
      objectsSource.setData(objectsToGeoJson(objectsRef.current, selectedIdRef.current));
    }

    routesSource.setData(routesToGeoJson(routesRef.current));

    const objectsKey = objectsRef.current
      .map((obj) => obj.id)
      .sort()
      .join("|");
    if (objectsKey !== lastObjectsKeyRef.current) {
      lastObjectsKeyRef.current = objectsKey;
      didFitBoundsRef.current = false;
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

    const useClusters = objectsRef.current.length > MAP_CLUSTER_MIN_OBJECTS;
    for (const layerId of ["clusters", "cluster-count"]) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", useClusters ? "visible" : "none");
      }
    }

    if (
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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialTheme = themeRef.current;
    containerRef.current.style.backgroundColor = MAP_BASEMAP_THEMES[initialTheme].backgroundColor;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createMapStyle(MAP_BASEMAP_THEMES[initialTheme].backgroundColor),
      center: ARGENTINA_CENTER,
      zoom: ARGENTINA_ZOOM,
      minZoom: 3,
      maxZoom: 16,
      maxPitch: 85,
      attributionControl: { compact: true },
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
      "top-right"
    );

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

    const bindMarkerInteractions = (layerId: string) => {
      map.on("click", layerId, (event) => {
        const feature = event.features?.[0] as Feature<Point> | undefined;
        const id = feature?.properties?.id as string | undefined;
        if (!id) return;
        const obj = objectsRef.current.find((item) => item.id === id) ?? null;
        onSelectRef.current(obj);
      });
      map.on("mouseenter", layerId, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
      });
    };

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

      map.addSource("regions", {
        type: "geojson",
        data: ARGENTINA_REGIONS_GEOJSON as GeoJSON.FeatureCollection,
      });
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

      bindClusterInteractions();
      layersReadyRef.current = true;
      setMapLayersReady(true);
      applyLayerData(map);
      bindMarkerInteractions("object-markers-dot");

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
              "icon-size": 0.72,
              "icon-allow-overlap": true,
              "icon-anchor": "bottom",
              "icon-offset": [0, 4],
            },
          });
          bindMarkerInteractions("unclustered-marker");
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

    return () => {
      map.remove();
      mapRef.current = null;
      layersReadyRef.current = false;
      setMapLayersReady(false);
      lastObjectsKeyRef.current = "";
      didFitBoundsRef.current = false;
      clusterModeRef.current = null;
    };
  }, [applyLayerData, applyMapOverlays]);

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
    if (!map || !selectedId) return;
    const obj = objects.find((item) => item.id === selectedId);
    if (!obj) return;
    map.flyTo({
      center: [obj.longitude, obj.latitude],
      zoom: Math.max(map.getZoom(), 9),
      essential: true,
    });
  }, [selectedId, objects]);

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full", className)}
      role="region"
      aria-label="Интерактивная карта Аргентины"
    />
  );
}
