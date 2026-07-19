"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { ArticleMapPoint } from "@/lib/article-map-points";
import { createMapPinDivIcon } from "@/lib/map-leaflet-icons";
import { cn } from "@/lib/cn";
import "leaflet/dist/leaflet.css";

type Props = {
  points: ArticleMapPoint[];
  className?: string;
  /** Без шапки и футера — для inline-блоков */
  embedded?: boolean;
};

export default function ArticlePlacesMiniMap({ points, className, embedded = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || points.length === 0) return;

    let cancelled = false;

    void import("leaflet").then((leafletModule) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const L = leafletModule.default;
      const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 18,
      }).addTo(map);

      const bounds: import("leaflet").LatLngExpression[] = [];
      points.forEach((point, index) => {
        bounds.push([point.lat, point.lng]);
        const marker = L.marker([point.lat, point.lng], {
          icon: L.divIcon(
            createMapPinDivIcon({
              tone: index === 0 ? "brand" : "muted",
              active: index === 0,
              size: index === 0 ? "lg" : "sm",
            }),
          ),
        });
        marker.bindPopup(point.label);
        marker.addTo(map);
      });

      if (bounds.length > 1) {
        map.fitBounds(bounds as import("leaflet").LatLngBoundsExpression, {
          padding: [24, 24],
          maxZoom: 10,
        });
      } else {
        map.setView([points[0].lat, points[0].lng], 10);
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

  if (embedded) {
    return (
      <div
        ref={containerRef}
        className={cn("h-[200px] w-full sm:h-[240px]", className)}
        aria-label="Мини-карта мест из статьи"
      />
    );
  }

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
