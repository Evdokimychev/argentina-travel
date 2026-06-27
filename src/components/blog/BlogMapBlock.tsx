"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

type BlogMapBlockProps = {
  lat: number;
  lng: number;
  label: string;
};

export default function BlogMapBlock({ lat, lng, label }: BlogMapBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    void import("leaflet").then((leafletModule) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const L = leafletModule.default;

      const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 18,
      }).addTo(map);

      L.marker([lat, lng], {
        icon: L.divIcon({
          className: "",
          html: `<div class="places-detail-map-marker places-detail-map-marker--main"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(map);

      map.setView([lat, lng], 11);
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <MapPin className="h-4 w-4 text-sky" aria-hidden />
        <p className="font-heading text-sm font-semibold text-charcoal">{label}</p>
      </div>
      <div
        ref={containerRef}
        className="h-[200px] w-full sm:h-[240px]"
        role="img"
        aria-label={`Карта: ${label}`}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 text-xs text-slate">
        <span>
          {lat.toFixed(4)}°, {lng.toFixed(4)}°
        </span>
        <Link href={`/mapa-argentina?q=${encodeURIComponent(label)}`} className="font-medium text-sky hover:underline">
          На карте страны →
        </Link>
      </div>
    </div>
  );
}
