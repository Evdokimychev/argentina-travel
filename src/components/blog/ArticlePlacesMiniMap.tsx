"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import Link from "next/link";
import type { ArticleMapPoint } from "@/lib/article-map-points";
import { cn } from "@/lib/cn";
import "leaflet/dist/leaflet.css";

type Props = {
  points: ArticleMapPoint[];
  className?: string;
};

function markerIcon(active = false) {
  return L.divIcon({
    className: "",
    html: `<div class="places-detail-map-marker${active ? " places-detail-map-marker--main" : ""}"></div>`,
    iconSize: active ? [24, 24] : [14, 14],
    iconAnchor: active ? [12, 12] : [7, 7],
  });
}

export default function ArticlePlacesMiniMap({ points, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || points.length === 0) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points.length]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || points.length === 0) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    const bounds: L.LatLngExpression[] = [];
    points.forEach((point, index) => {
      bounds.push([point.lat, point.lng]);
      const marker = L.marker([point.lat, point.lng], {
        icon: markerIcon(index === 0),
      });
      marker.bindPopup(point.label);
      marker.addTo(map);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [24, 24], maxZoom: 10 });
    } else {
      map.setView([points[0].lat, points[0].lng], 10);
    }
  }, [points]);

  if (points.length === 0) return null;

  return (
    <aside className={cn("overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm", className)}>
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-semibold text-charcoal">На карте</p>
        <p className="text-xs text-slate">{points.length} точек из статьи</p>
      </div>
      <div ref={containerRef} className="h-[220px] w-full sm:h-[260px]" aria-label="Мини-карта мест из статьи" />
      <div className="border-t border-gray-100 px-4 py-3">
        <Link href="/mapa-argentina" className="text-sm font-medium text-sky hover:underline">
          Открыть полную карту Аргентины →
        </Link>
      </div>
    </aside>
  );
}
