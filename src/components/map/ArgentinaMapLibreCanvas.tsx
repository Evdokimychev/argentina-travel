"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type { MapMarkerKind, MapObject, MapRouteItem } from "@/lib/map-types";
import { ARGENTINA_REGIONS_GEOJSON } from "@/data/argentina-regions";
import { cn } from "@/lib/cn";
import "maplibre-gl/dist/maplibre-gl.css";

const ARGENTINA_CENTER: [number, number] = [-64.2, -38.5];
const ARGENTINA_ZOOM = 4;

const KIND_COLORS: Record<MapMarkerKind, string> = {
  city: "#2563eb",
  national_park: "#059669",
  attraction: "#d97706",
  tour: "#7c3aed",
  airport: "#0891b2",
  route: "#6366f1",
  region: "#94a3b8",
  transport: "#64748b",
};

type Props = {
  objects: MapObject[];
  routes: MapRouteItem[];
  activeKinds: MapMarkerKind[];
  selectedId: string | null;
  onSelect: (object: MapObject | null) => void;
  className?: string;
};

function objectsToGeoJson(objects: MapObject[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: objects.map((obj) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [obj.longitude, obj.latitude] },
      properties: {
        id: obj.id,
        kind: obj.kind,
        title: obj.title,
        color: KIND_COLORS[obj.kind] ?? "#2563eb",
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
  onSelect,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const objectsRef = useRef(objects);

  onSelectRef.current = onSelect;
  objectsRef.current = objects;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#f1f5f9" },
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

    map.on("load", () => {
      map.addSource("osm", {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap",
      });
      map.addLayer({ id: "osm", type: "raster", source: "osm" });

      map.addSource("regions", {
        type: "geojson",
        data: ARGENTINA_REGIONS_GEOJSON as GeoJSON.FeatureCollection,
      });
      map.addLayer({
        id: "regions-fill",
        type: "fill",
        source: "regions",
        paint: {
          "fill-color": "#e2e8f0",
          "fill-opacity": activeKinds.includes("region") ? 0.35 : 0,
        },
      });
      map.addLayer({
        id: "regions-outline",
        type: "line",
        source: "regions",
        paint: {
          "line-color": "#94a3b8",
          "line-width": 1,
          "line-opacity": activeKinds.includes("region") ? 0.8 : 0,
        },
      });

      map.addSource("routes", { type: "geojson", data: routesToGeoJson([]) });
      map.addLayer({
        id: "routes-line",
        type: "line",
        source: "routes",
        paint: {
          "line-color": KIND_COLORS.route,
          "line-width": 3,
          "line-opacity": 0.75,
        },
        layout: { "line-cap": "round", "line-join": "round" },
      });

      map.addSource("objects", {
        type: "geojson",
        data: objectsToGeoJson([]),
        cluster: true,
        clusterMaxZoom: 11,
        clusterRadius: 42,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "objects",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#38bdf8",
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 30, 28],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "objects",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
        },
        paint: { "text-color": "#0f172a" },
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "objects",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on("click", "clusters", (event) => {
        const features = map.queryRenderedFeatures(event.point, { layers: ["clusters"] });
        const cluster = features[0];
        if (!cluster?.geometry || cluster.geometry.type !== "Point") return;
        const source = map.getSource("objects") as maplibregl.GeoJSONSource;
        const clusterId = cluster.properties?.cluster_id;
        if (clusterId == null) return;
        void source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const [lng, lat] = (cluster.geometry as Point).coordinates;
          map.easeTo({ center: [lng, lat], zoom });
        });
      });

      map.on("click", "unclustered-point", (event) => {
        const feature = event.features?.[0] as Feature<Point> | undefined;
        const id = feature?.properties?.id as string | undefined;
        if (!id) return;
        const obj = objectsRef.current.find((item) => item.id === id) ?? null;
        onSelectRef.current(obj);
      });

      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "unclustered-point", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "unclustered-point", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const objectsSource = map.getSource("objects") as maplibregl.GeoJSONSource | undefined;
    const routesSource = map.getSource("routes") as maplibregl.GeoJSONSource | undefined;
    if (objectsSource) objectsSource.setData(objectsToGeoJson(objects));
    if (routesSource) routesSource.setData(routesToGeoJson(routes));

    map.setPaintProperty(
      "regions-fill",
      "fill-opacity",
      activeKinds.includes("region") ? 0.35 : 0
    );
    map.setPaintProperty(
      "regions-outline",
      "line-opacity",
      activeKinds.includes("region") ? 0.8 : 0
    );
    map.setPaintProperty(
      "routes-line",
      "line-opacity",
      activeKinds.includes("route") ? 0.75 : 0
    );
  }, [objects, routes, activeKinds]);

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
