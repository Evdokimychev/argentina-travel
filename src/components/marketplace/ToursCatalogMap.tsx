"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { TourListing } from "@/types";
import { CurrencyCode, LocaleCode } from "@/types/locale";
import { formatPriceUsd } from "@/lib/currency";
import {
  ARGENTINA_DEFAULT_ZOOM,
  ARGENTINA_MAP_CENTER,
  escapeMapHtml,
  getTourMapBounds,
} from "@/lib/tour-map";
import { cn } from "@/lib/cn";
import "leaflet/dist/leaflet.css";

interface ToursCatalogMapProps {
  tours: TourListing[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  currency: CurrencyCode;
  locale: LocaleCode;
  className?: string;
}

function createDotIcon(active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="tours-map-marker${active ? " tours-map-marker--active" : ""}"></div>`,
    iconSize: active ? [20, 20] : [14, 14],
    iconAnchor: active ? [10, 10] : [7, 7],
    popupAnchor: [0, -12],
  });
}

function buildPopupHtml(tour: TourListing, priceLabel: string): string {
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

export default function ToursCatalogMap({
  tours,
  selectedId,
  onSelect,
  currency,
  locale,
  className,
}: ToursCatalogMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  const toursRef = useRef(tours);
  const currencyRef = useRef(currency);
  const localeRef = useRef(locale);

  onSelectRef.current = onSelect;
  toursRef.current = tours;
  currencyRef.current = currency;
  localeRef.current = locale;

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    mapRef.current = map;

    return () => {
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    if (tours.length === 0) {
      map.setView(ARGENTINA_MAP_CENTER, ARGENTINA_DEFAULT_ZOOM);
      return;
    }

    tours.forEach((tour) => {
      const marker = L.marker([tour.latitude, tour.longitude], {
        icon: createDotIcon(false),
        zIndexOffset: 100,
      });

      const priceLabel = formatPriceUsd(
        tour.priceUsd,
        currencyRef.current,
        localeRef.current
      );
      marker.bindPopup(buildPopupHtml(tour, priceLabel), {
        className: "tours-map-popup-shell",
        maxWidth: 280,
        minWidth: 240,
      });

      marker.on("click", () => onSelectRef.current(tour.id));
      marker.addTo(map);
      markersRef.current.set(tour.id, marker);
    });

    const bounds = getTourMapBounds(tours);
    if (bounds) {
      map.fitBounds(bounds, { padding: [56, 56], maxZoom: 8 });
    }
  }, [tours, currency, locale]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    toursRef.current.forEach((tour) => {
      const marker = markersRef.current.get(tour.id);
      if (!marker) return;

      const active = tour.id === selectedId;
      marker.setIcon(createDotIcon(active));
      marker.setZIndexOffset(active ? 1000 : 100);

      if (active) {
        marker.openPopup();
        map.panTo([tour.latitude, tour.longitude], { animate: true, duration: 0.45 });
      } else {
        marker.closePopup();
      }
    });
  }, [selectedId]);

  return (
    <div className={cn("relative h-full min-h-[280px] w-full", className)}>
      <div
        ref={containerRef}
        className="tours-map-canvas absolute inset-0 z-0"
        role="application"
        aria-label="Карта туров по Аргентине"
      />
    </div>
  );
}
