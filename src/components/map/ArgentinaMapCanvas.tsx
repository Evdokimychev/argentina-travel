"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { GeoJSON as GeoJsonType } from "geojson";
import {
  ARGENTINA_DEFAULT_ZOOM,
  ARGENTINA_MAP_CENTER,
  escapeMapHtml,
  getLatLngBounds,
} from "@/lib/tour-map";
import { clusterMapItems } from "@/lib/map-cluster";
import { placeHref } from "@/lib/places-repository";
import { PLACE_CATEGORY_LABELS, type PlaceCategory } from "@/types/place";
import type {
  MapLayerId,
  MapPlacePoint,
  MapRegionFeatureProperties,
  MapRouteItem,
  MapTourPoint,
} from "@/lib/map-types";
import { ARGENTINA_REGIONS_GEOJSON } from "@/data/argentina-regions";
import { cn } from "@/lib/cn";
import "leaflet/dist/leaflet.css";

interface ArgentinaMapCanvasProps {
  layers: MapLayerId[];
  tours: MapTourPoint[];
  places: MapPlacePoint[];
  routes: MapRouteItem[];
  selectedTourId: string | null;
  selectedPlaceSlug: string | null;
  selectedRouteSlug: string | null;
  highlightRegion: string;
  onSelectTour: (id: string) => void;
  onSelectPlace: (slug: string) => void;
  onSelectRoute: (slug: string) => void;
  formatTourPrice: (priceUsd: number) => string;
  className?: string;
}

function createTourIcon(active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="tours-map-marker${active ? " tours-map-marker--active" : ""}"></div>`,
    iconSize: active ? [20, 20] : [14, 14],
    iconAnchor: active ? [10, 10] : [7, 7],
    popupAnchor: [0, -12],
  });
}

function createClusterIcon(count: number) {
  return L.divIcon({
    className: "",
    html: `<div class="places-map-cluster">${count}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function buildTourPopup(tour: MapTourPoint, priceLabel: string): string {
  return `
    <a href="/tours/${escapeMapHtml(tour.slug)}" class="tours-map-popup">
      <img src="${escapeMapHtml(tour.image)}" alt="" class="tours-map-popup__img" />
      <div class="tours-map-popup__body">
        <strong class="tours-map-popup__title">${escapeMapHtml(tour.title)}</strong>
        <span class="tours-map-popup__meta">${escapeMapHtml(tour.destination)} · ${escapeMapHtml(tour.region)}</span>
        <span class="tours-map-popup__price">${escapeMapHtml(priceLabel)}</span>
      </div>
    </a>
  `;
}

function buildPlacePopup(place: MapPlacePoint): string {
  const category =
    PLACE_CATEGORY_LABELS[place.category as PlaceCategory] ?? place.category;
  return `
    <a href="${escapeMapHtml(placeHref(place.slug))}" class="tours-map-popup">
      ${place.coverImage ? `<img src="${escapeMapHtml(place.coverImage)}" alt="" class="tours-map-popup__img" />` : ""}
      <div class="tours-map-popup__body">
        <strong class="tours-map-popup__title">${escapeMapHtml(place.name)}</strong>
        <span class="tours-map-popup__meta">${escapeMapHtml(place.region)} · ${escapeMapHtml(category)}</span>
      </div>
    </a>
  `;
}

function buildRoutePopup(route: MapRouteItem): string {
  return `
    <a href="/tours/${escapeMapHtml(route.slug)}" class="tours-map-popup">
      <img src="${escapeMapHtml(route.image)}" alt="" class="tours-map-popup__img" />
      <div class="tours-map-popup__body">
        <strong class="tours-map-popup__title">${escapeMapHtml(route.title)}</strong>
        <span class="tours-map-popup__meta">${route.points.length} точек маршрута</span>
      </div>
    </a>
  `;
}

function regionStyle(
  feature: GeoJSON.Feature | undefined,
  highlightRegion: string,
  hoveredId: string | null
) {
  const props = feature?.properties as MapRegionFeatureProperties | undefined;
  const id = props?.id ?? "";
  const slug = props?.slug ?? "";
  const highlighted =
    Boolean(highlightRegion) &&
    (id === highlightRegion ||
      slug === highlightRegion ||
      props?.nameRu?.toLowerCase().includes(highlightRegion.toLowerCase()));
  const hovered = hoveredId != null && (id === hoveredId || slug === hoveredId);

  return {
    color: highlighted || hovered ? "#2563eb" : "#94a3b8",
    weight: highlighted || hovered ? 2.5 : 1.25,
    fillColor: highlighted ? "#38bdf8" : hovered ? "#7dd3fc" : "#e2e8f0",
    fillOpacity: highlighted ? 0.35 : hovered ? 0.28 : 0.12,
  };
}

export default function ArgentinaMapCanvas({
  layers,
  tours,
  places,
  routes,
  selectedTourId,
  selectedPlaceSlug,
  selectedRouteSlug,
  highlightRegion,
  onSelectTour,
  onSelectPlace,
  onSelectRoute,
  formatTourPrice,
  className,
}: ArgentinaMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const regionsLayerRef = useRef<L.GeoJSON | null>(null);
  const toursLayerRef = useRef<L.LayerGroup | null>(null);
  const placesLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const hoveredRegionRef = useRef<string | null>(null);

  const callbacksRef = useRef({
    onSelectTour,
    onSelectPlace,
    onSelectRoute,
    formatTourPrice,
  });
  callbacksRef.current = {
    onSelectTour,
    onSelectPlace,
    onSelectRoute,
    formatTourPrice,
  };

  const dataRef = useRef({ tours, places, routes, layers, highlightRegion });
  dataRef.current = { tours, places, routes, layers, highlightRegion };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    map.setView(ARGENTINA_MAP_CENTER, ARGENTINA_DEFAULT_ZOOM);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      regionsLayerRef.current = null;
      toursLayerRef.current = null;
      placesLayerRef.current = null;
      routesLayerRef.current = null;
    };
  }, []);

  const renderToursLayer = (map: L.Map) => {
    toursLayerRef.current?.remove();
    if (!dataRef.current.layers.includes("tours")) {
      toursLayerRef.current = null;
      return;
    }

    const group = L.layerGroup();
    const zoom = map.getZoom();
    const clusters = clusterMapItems(dataRef.current.tours, zoom);

    for (const cluster of clusters) {
      if (cluster.items.length === 1) {
        const tour = cluster.items[0];
        const marker = L.marker([tour.latitude, tour.longitude], {
          icon: createTourIcon(tour.id === selectedTourId),
          zIndexOffset: tour.id === selectedTourId ? 1000 : 100,
        });
        marker.bindPopup(
          buildTourPopup(tour, callbacksRef.current.formatTourPrice(tour.priceUsd)),
          { className: "tours-map-popup-shell", maxWidth: 280, minWidth: 240 }
        );
        marker.on("click", () => callbacksRef.current.onSelectTour(tour.id));
        group.addLayer(marker);
      } else {
        const marker = L.marker([cluster.latitude, cluster.longitude], {
          icon: createClusterIcon(cluster.items.length),
        });
        marker.on("click", () => {
          map.setView([cluster.latitude, cluster.longitude], Math.min(map.getZoom() + 2, 12));
        });
        group.addLayer(marker);
      }
    }

    group.addTo(map);
    toursLayerRef.current = group;
  };

  const renderPlacesLayer = (map: L.Map) => {
    placesLayerRef.current?.remove();
    if (!dataRef.current.layers.includes("places")) {
      placesLayerRef.current = null;
      return;
    }

    const group = L.layerGroup();
    const zoom = map.getZoom();
    const clusters = clusterMapItems(dataRef.current.places, zoom);

    for (const cluster of clusters) {
      if (cluster.items.length === 1) {
        const place = cluster.items[0];
        const marker = L.marker([place.latitude, place.longitude], {
          zIndexOffset: place.slug === selectedPlaceSlug ? 900 : 80,
        });
        marker.bindPopup(buildPlacePopup(place), {
          className: "tours-map-popup-shell",
          maxWidth: 280,
          minWidth: 240,
        });
        marker.on("click", () => callbacksRef.current.onSelectPlace(place.slug));
        group.addLayer(marker);
      } else {
        const marker = L.marker([cluster.latitude, cluster.longitude], {
          icon: createClusterIcon(cluster.items.length),
        });
        marker.on("click", () => {
          map.setView([cluster.latitude, cluster.longitude], Math.min(map.getZoom() + 2, 12));
        });
        group.addLayer(marker);
      }
    }

    group.addTo(map);
    placesLayerRef.current = group;
  };

  const renderRoutesLayer = (map: L.Map) => {
    routesLayerRef.current?.remove();
    if (!dataRef.current.layers.includes("routes")) {
      routesLayerRef.current = null;
      return;
    }

    const group = L.layerGroup();

    for (const route of dataRef.current.routes) {
      if (route.points.length < 2) continue;
      const coords = route.points.map((point) => [point.lat, point.lng] as [number, number]);
      const active = route.slug === selectedRouteSlug;

      const line = L.polyline(coords, {
        color: active ? "#2563eb" : "#d4533b",
        weight: active ? 4 : 2.5,
        opacity: active ? 0.95 : 0.6,
        lineCap: "round",
        lineJoin: "round",
      });
      line.bindPopup(buildRoutePopup(route), { className: "tours-map-popup-shell" });
      line.on("click", () => callbacksRef.current.onSelectRoute(route.slug));
      group.addLayer(line);

      const start = route.points[0];
      const marker = L.marker([start.lat, start.lng], {
        icon: createTourIcon(active),
      });
      marker.bindPopup(buildRoutePopup(route), { className: "tours-map-popup-shell" });
      marker.on("click", () => callbacksRef.current.onSelectRoute(route.slug));
      group.addLayer(marker);
    }

    group.addTo(map);
    routesLayerRef.current = group;
  };

  const renderRegionsLayer = (map: L.Map) => {
    regionsLayerRef.current?.remove();
    if (!dataRef.current.layers.includes("regions")) {
      regionsLayerRef.current = null;
      return;
    }

    const layer = L.geoJSON(ARGENTINA_REGIONS_GEOJSON as GeoJsonType, {
      style: (feature) =>
        regionStyle(feature, dataRef.current.highlightRegion, hoveredRegionRef.current),
      onEachFeature: (feature, layerInstance) => {
        const props = feature.properties as MapRegionFeatureProperties;
        layerInstance.bindTooltip(props.nameRu, { sticky: true, opacity: 0.95 });
        layerInstance.on("mouseover", () => {
          hoveredRegionRef.current = props.id;
          regionsLayerRef.current?.setStyle((f) =>
            regionStyle(f, dataRef.current.highlightRegion, props.id)
          );
        });
        layerInstance.on("mouseout", () => {
          hoveredRegionRef.current = null;
          regionsLayerRef.current?.setStyle((f) =>
            regionStyle(f, dataRef.current.highlightRegion, null)
          );
        });
      },
    });

    layer.addTo(map);
    regionsLayerRef.current = layer;
  };

  const renderAllLayers = (map: L.Map, fit = false) => {
    renderRegionsLayer(map);
    renderRoutesLayer(map);
    renderToursLayer(map);
    renderPlacesLayer(map);

    if (!fit) return;

    const boundsPoints = [
      ...(dataRef.current.layers.includes("tours") ? dataRef.current.tours : []),
      ...(dataRef.current.layers.includes("places") ? dataRef.current.places : []),
    ];

    const bounds = getLatLngBounds(boundsPoints);

    if (bounds && boundsPoints.length > 0) {
      map.fitBounds(bounds, { padding: [56, 56], maxZoom: 8 });
    } else {
      map.setView(ARGENTINA_MAP_CENTER, ARGENTINA_DEFAULT_ZOOM);
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    renderAllLayers(map, true);

    const onZoomEnd = () => renderAllLayers(map, false);
    map.on("zoomend", onZoomEnd);
    return () => {
      map.off("zoomend", onZoomEnd);
    };
  }, [tours, places, routes, layers, highlightRegion, selectedTourId, selectedPlaceSlug, selectedRouteSlug]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedTourId) return;
    const tour = tours.find((item) => item.id === selectedTourId);
    if (tour) {
      map.panTo([tour.latitude, tour.longitude], { animate: true, duration: 0.45 });
    }
  }, [selectedTourId, tours]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPlaceSlug) return;
    const place = places.find((item) => item.slug === selectedPlaceSlug);
    if (place) {
      map.panTo([place.latitude, place.longitude], { animate: true, duration: 0.45 });
    }
  }, [selectedPlaceSlug, places]);

  return (
    <div className={cn("relative h-full min-h-[280px] w-full", className)}>
      <div
        ref={containerRef}
        className="tours-map-canvas absolute inset-0 z-0"
        role="application"
        aria-label="Интерактивная карта Аргентины: туры, места, регионы и маршруты"
      />
    </div>
  );
}
