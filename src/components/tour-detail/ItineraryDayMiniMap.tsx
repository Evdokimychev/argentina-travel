"use client";

import { useEffect, useRef } from "react";
import type { TourRoutePoint } from "@/types";
import { cn } from "@/lib/cn";
import "leaflet/dist/leaflet.css";

type Props = {
  points: TourRoutePoint[];
  dayNumber: number;
  className?: string;
};

function markerIcon(active = false) {
  // Leaflet loaded dynamically — icon HTML only after import
  return `<div class="itinerary-day-map-marker${active ? " itinerary-day-map-marker--main" : ""}"></div>`;
}

export default function ItineraryDayMiniMap({ points, dayNumber, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    let cancelled = false;

    void import("leaflet").then((leafletModule) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const L = leafletModule.default;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: false,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 14,
      }).addTo(map);

      const bounds: [number, number][] = [];
      points.forEach((point, index) => {
        bounds.push([point.lat, point.lng]);
        L.marker([point.lat, point.lng], {
          icon: L.divIcon({
            className: "",
            html: markerIcon(index === 0),
            iconSize: index === 0 ? [22, 22] : [16, 16],
            iconAnchor: index === 0 ? [11, 11] : [8, 8],
          }),
        })
          .bindPopup(point.name)
          .addTo(map);
      });

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 8 });
      } else {
        map.setView(bounds[0], 9);
      }

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [points]);

  if (points.length === 0) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-gray-100 bg-gray-50 ring-1 ring-gray-100",
        className
      )}
    >
      <p className="border-b border-gray-100 px-3 py-2 text-xs font-medium text-slate">
        Маршрут дня {dayNumber}
        {points.length > 1 ? ` · ${points.length} точек` : ""}
      </p>
      <div
        ref={containerRef}
        className="h-36 w-full sm:h-40"
        role="img"
        aria-label={`Карта маршрута дня ${dayNumber}`}
      />
    </div>
  );
}
