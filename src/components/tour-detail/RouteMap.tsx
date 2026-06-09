"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { TourRoutePoint } from "@/types";
import { cn } from "@/lib/cn";
import "leaflet/dist/leaflet.css";

interface RouteMapProps {
  points: TourRoutePoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

function createMarkerIcon(order: number, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="route-map-marker${active ? " route-map-marker--active" : ""}">${order}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
}

export default function RouteMap({
  points,
  selectedId,
  onSelect,
  className,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);

  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markersRef.current.clear();
    }

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    const coords: L.LatLngExpression[] = points.map((p) => [p.lat, p.lng]);

    L.polyline(coords, {
      color: "#d4533b",
      weight: 3,
      opacity: 0.9,
      dashArray: "10 12",
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    points.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: createMarkerIcon(index + 1, false),
        zIndexOffset: 100 + index,
      });

      const popupHtml = point.dayNumber
        ? `<strong>${point.name}</strong><br><span>День ${point.dayNumber}</span>`
        : `<strong>${point.name}</strong>`;

      marker.bindPopup(popupHtml, { className: "route-map-popup" });
      marker.on("click", () => onSelectRef.current?.(point.id));
      marker.addTo(map);
      markersRef.current.set(point.id, marker);
    });

    map.fitBounds(L.latLngBounds(coords), { padding: [48, 48], maxZoom: 9 });
    mapRef.current = map;

    return () => {
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [points]);

  useEffect(() => {
    if (!mapRef.current) return;

    points.forEach((point, index) => {
      const marker = markersRef.current.get(point.id);
      if (!marker) return;
      marker.setIcon(createMarkerIcon(index + 1, point.id === selectedId));
      if (point.id === selectedId) {
        marker.openPopup();
        mapRef.current?.panTo([point.lat, point.lng], { animate: true, duration: 0.4 });
      }
    });
  }, [selectedId, points]);

  return (
    <div
      ref={containerRef}
      className={cn("route-map-canvas z-0 min-h-[288px] w-full", className)}
      role="img"
      aria-label="Интерактивная карта маршрута тура"
    />
  );
}
