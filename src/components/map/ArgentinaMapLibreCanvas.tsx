"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type { MapMarkerKind, MapObject, MapRouteItem } from "@/lib/map-types";
import { MAP_KIND_COLORS } from "@/lib/map-kind-colors";
import {
  MAP_BASEMAP_THEMES,
  MAP_BASEMAP_THEME_IDS,
  type MapBasemapThemeId,
} from "@/lib/map-basemap-themes";
import { registerMapMarkerImages } from "@/lib/map-marker-icons";
import { ARGENTINA_REGIONS_GEOJSON } from "@/data/argentina-regions";
import { cn } from "@/lib/cn";
import "maplibre-gl/dist/maplibre-gl.css";

const ARGENTINA_CENTER: [number, number] = [-64.2, -38.5];
const ARGENTINA_ZOOM = 4;

type Props = {
  objects: MapObject[];
  routes: MapRouteItem[];
  activeKinds: MapMarkerKind[];
  selectedId: string | null;
  theme: MapBasemapThemeId;
  onSelect: (object: MapObject | null) => void;
  className?: string;
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
  const didFitBoundsRef = useRef(false);
  const layersReadyRef = useRef(false);

  onSelectRef.current = onSelect;
  objectsRef.current = objects;
  routesRef.current = routes;
  activeKindsRef.current = activeKinds;
  selectedIdRef.current = selectedId;
  themeRef.current = theme;

  const applyLayerData = useCallback((map: maplibregl.Map) => {
    const objectsSource = map.getSource("objects") as maplibregl.GeoJSONSource | undefined;
    const routesSource = map.getSource("routes") as maplibregl.GeoJSONSource | undefined;
    if (!objectsSource || !routesSource) return false;

    objectsSource.setData(objectsToGeoJson(objectsRef.current, selectedIdRef.current));
    routesSource.setData(routesToGeoJson(routesRef.current));

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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialTheme = themeRef.current;
    containerRef.current.style.backgroundColor = MAP_BASEMAP_THEMES[initialTheme].backgroundColor;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": MAP_BASEMAP_THEMES[initialTheme].backgroundColor },
          },
        ],
      },
      center: ARGENTINA_CENTER,
      zoom: ARGENTINA_ZOOM,
      minZoom: 3,
      maxZoom: 16,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const bindInteractions = () => {
      map.on("click", "clusters", (event) => {
        const features = map.queryRenderedFeatures(event.point, { layers: ["clusters"] });
        const cluster = features[0];
        if (!cluster?.geometry || cluster.geometry.type !== "Point") return;
        const source = map.getSource("objects") as maplibregl.GeoJSONSource;
        const clusterId = cluster.properties?.cluster_id;
        if (clusterId == null) return;
        void source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const [lng, lat] = (cluster.geometry as Point).coordinates;
          map.easeTo({ center: [lng, lat], zoom: Math.min(zoom + 0.5, 14) });
        });
      });

      map.on("click", "unclustered-marker", (event) => {
        const feature = event.features?.[0] as Feature<Point> | undefined;
        const id = feature?.properties?.id as string | undefined;
        if (!id) return;
        const obj = objectsRef.current.find((item) => item.id === id) ?? null;
        onSelectRef.current(obj);
      });

      for (const layerId of ["clusters", "unclustered-marker"]) {
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
      }
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

      map.addSource("objects", {
        type: "geojson",
        data: objectsToGeoJson([], null),
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 28,
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
          "text-field": "{point_count_abbreviated}",
          "text-size": 11,
        },
        paint: { "text-color": "#0f172a" },
      });

      void registerMapMarkerImages(map).then(() => {
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

        bindInteractions();
        layersReadyRef.current = true;
        applyLayerData(map);
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layersReadyRef.current = false;
    };
  }, [applyLayerData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sync = () => {
      applyLayerData(map);
    };

    if (layersReadyRef.current && applyLayerData(map)) {
      sync();
      return;
    }

    map.once("load", sync);
    return () => {
      map.off("load", sync);
    };
  }, [objects, routes, activeKinds, selectedId, applyLayerData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReadyRef.current) return;
    applyBasemapTheme(map, theme);
  }, [theme, applyBasemapTheme]);

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
