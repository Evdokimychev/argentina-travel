"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { PlaceListing } from "@/types/place";
import { PLACE_CATEGORY_LABELS } from "@/types/place";
import {
  ARGENTINA_DEFAULT_ZOOM,
  ARGENTINA_MAP_CENTER,
  escapeMapHtml,
} from "@/lib/tour-map";
import { placeHref } from "@/lib/places-repository";
import { cn } from "@/lib/cn";
import "leaflet/dist/leaflet.css";

interface PlacesCatalogMapProps {
  places: PlaceListing[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  className?: string;
}

function getPlaceBounds(places: PlaceListing[]): [[number, number], [number, number]] | null {
  if (places.length === 0) return null;
  let minLat = places[0].latitude;
  let maxLat = places[0].latitude;
  let minLng = places[0].longitude;
  let maxLng = places[0].longitude;
  for (const p of places) {
    minLat = Math.min(minLat, p.latitude);
    maxLat = Math.max(maxLat, p.latitude);
    minLng = Math.min(minLng, p.longitude);
    maxLng = Math.max(maxLng, p.longitude);
  }
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

/** Custom pin marker — Leaflet's default PNG icons don't resolve under bundlers. */
function createPlaceIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div class="places-map-marker"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  });
}

function buildPopupHtml(place: PlaceListing): string {
  const category = PLACE_CATEGORY_LABELS[place.category];
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

/** Simple grid clustering when zoomed out — groups markers in ~60px cells */
function clusterPlaces(map: L.Map, places: PlaceListing[]): L.LayerGroup {
  const group = L.layerGroup();
  const zoom = map.getZoom();
  if (zoom >= 8 || places.length <= 30) {
    for (const place of places) {
      const marker = L.marker([place.latitude, place.longitude], { icon: createPlaceIcon() });
      marker.bindPopup(buildPopupHtml(place));
      group.addLayer(marker);
    }
    return group;
  }

  const cellSize = 0.5 / Math.pow(2, zoom - 4);
  const cells = new Map<string, PlaceListing[]>();

  for (const place of places) {
    const cellX = Math.floor(place.longitude / cellSize);
    const cellY = Math.floor(place.latitude / cellSize);
    const key = `${cellX}:${cellY}`;
    const list = cells.get(key) ?? [];
    list.push(place);
    cells.set(key, list);
  }

  for (const [, cellPlaces] of cells) {
    const avgLat = cellPlaces.reduce((s, p) => s + p.latitude, 0) / cellPlaces.length;
    const avgLng = cellPlaces.reduce((s, p) => s + p.longitude, 0) / cellPlaces.length;

    if (cellPlaces.length === 1) {
      const marker = L.marker([avgLat, avgLng], { icon: createPlaceIcon() });
      marker.bindPopup(buildPopupHtml(cellPlaces[0]));
      group.addLayer(marker);
    } else {
      const clusterIcon = L.divIcon({
        className: "",
        html: `<div class="places-map-cluster">${cellPlaces.length}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const marker = L.marker([avgLat, avgLng], { icon: clusterIcon });
      marker.on("click", () => {
        map.setView([avgLat, avgLng], Math.min(map.getZoom() + 2, 12));
      });
      group.addLayer(marker);
    }
  }

  return group;
}

export default function PlacesCatalogMap({
  places,
  selectedSlug,
  onSelect,
  className,
}: PlacesCatalogMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterLayerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  const placesRef = useRef(places);

  onSelectRef.current = onSelect;
  placesRef.current = places;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: true, zoomControl: true });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 18,
    }).addTo(map);

    map.setView(ARGENTINA_MAP_CENTER, ARGENTINA_DEFAULT_ZOOM);
    mapRef.current = map;

    map.on("zoomend", () => {
      if (!mapRef.current) return;
      clusterLayerRef.current?.remove();
      clusterLayerRef.current = clusterPlaces(mapRef.current, placesRef.current);
      clusterLayerRef.current.addTo(mapRef.current);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    clusterLayerRef.current?.remove();
    markersRef.current.clear();

    const layer = clusterPlaces(map, places);
    layer.addTo(map);
    clusterLayerRef.current = layer;

    const bounds = getPlaceBounds(places);
    if (bounds && places.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    } else if (places.length === 1) {
      map.setView([places[0].latitude, places[0].longitude], 10);
    }
  }, [places]);

  useEffect(() => {
    if (!selectedSlug || !mapRef.current) return;
    const place = places.find((p) => p.slug === selectedSlug);
    if (place) {
      mapRef.current.setView([place.latitude, place.longitude], 11, { animate: true });
      onSelectRef.current(selectedSlug);
    }
  }, [selectedSlug, places]);

  return (
    <div
      ref={containerRef}
      className={cn("h-[480px] w-full overflow-hidden rounded-2xl border border-gray-100", className)}
      role="region"
      aria-label="Карта мест"
    />
  );
}
