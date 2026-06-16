"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { PlaceListing } from "@/types/place";
import { escapeMapHtml } from "@/lib/tour-map";
import { placeHref } from "@/lib/places-repository";
import { cn } from "@/lib/cn";
import "leaflet/dist/leaflet.css";

type PlaceDetailMapProps = {
  place: Pick<PlaceListing, "name" | "slug" | "latitude" | "longitude" | "region">;
  relatedPlaces?: PlaceListing[];
  className?: string;
};

function createMainIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="places-detail-map-marker places-detail-map-marker--main"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

function createRelatedIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="places-detail-map-marker"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

function popupHtml(name: string, href: string, meta?: string): string {
  return `
    <div class="tours-map-popup tours-map-popup--compact">
      <div class="tours-map-popup__body">
        <a href="${escapeMapHtml(href)}" class="tours-map-popup__title">${escapeMapHtml(name)}</a>
        ${meta ? `<span class="tours-map-popup__meta">${escapeMapHtml(meta)}</span>` : ""}
      </div>
    </div>
  `;
}

export default function PlaceDetailMap({ place, relatedPlaces = [], className }: PlaceDetailMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: true });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    const bounds: L.LatLngExpression[] = [[place.latitude, place.longitude]];

    const mainMarker = L.marker([place.latitude, place.longitude], { icon: createMainIcon() });
    mainMarker.bindPopup(popupHtml(place.name, placeHref(place.slug), place.region));
    mainMarker.addTo(map);

    for (const related of relatedPlaces.slice(0, 8)) {
      if (related.slug === place.slug) continue;
      bounds.push([related.latitude, related.longitude]);
      const marker = L.marker([related.latitude, related.longitude], { icon: createRelatedIcon() });
      marker.bindPopup(popupHtml(related.name, placeHref(related.slug), related.region));
      marker.addTo(map);
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [32, 32], maxZoom: 9 });
    } else {
      map.setView([place.latitude, place.longitude], 10);
    }
  }, [place, relatedPlaces]);

  return (
    <div
      ref={containerRef}
      className={cn("h-[280px] w-full overflow-hidden rounded-2xl border border-gray-100 sm:h-[320px]", className)}
      role="region"
      aria-label={`Карта: ${place.name}`}
    />
  );
}
