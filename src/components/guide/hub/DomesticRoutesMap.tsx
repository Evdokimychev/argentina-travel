"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { ExternalLink } from "lucide-react";
import FlightRoutePriceHint from "@/components/flights/FlightRoutePriceHint";
import { cn } from "@/lib/cn";
import {
  ARGENTINA_DOMESTIC_AIRPORTS,
  FREQUENCY_META,
  REGIONAL_DIRECT_ROUTES,
  buildCurvedLine,
  getAirport,
  getHubRoutes,
  type DomesticRouteFrequency,
} from "@/data/argentina-domestic-routes";
import { resolveDomesticRouteLabels } from "@/lib/flights/destination-airports";
import { buildFlightsSearchHref } from "@/lib/flights/search-href";
import { ROUTE_MAP_POPUP_OPTIONS } from "@/lib/tour-route-map";
import "leaflet/dist/leaflet.css";

type HubCode = "AEP" | "EZE";

function createDotIcon(color: string, active: boolean, isHub = false) {
  const size = isHub ? (active ? 22 : 18) : active ? 16 : 12;
  return L.divIcon({
    className: "",
    html: `<div class="domestic-routes-marker${active ? " domestic-routes-marker--active" : ""}${isHub ? " domestic-routes-marker--hub" : ""}" style="--marker-color:${color};width:${size}px;height:${size}px"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export default function DomesticRoutesMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    lines: Map<string, L.Polyline>;
    markers: Map<string, L.Marker>;
    regionalLines: L.Polyline[];
  }>({ lines: new Map(), markers: new Map(), regionalLines: [] });

  const [hub, setHub] = useState<HubCode>("AEP");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [showRegional, setShowRegional] = useState(true);

  const hubAirport = ARGENTINA_DOMESTIC_AIRPORTS[hub];
  const hubRoutes = useMemo(() => getHubRoutes(hub), [hub]);

  const highlightRoute = useCallback(
    (code: string | null) => {
      const layers = layersRef.current;
      layers.lines.forEach((line, key) => {
        const active = code === key;
        line.setStyle({
          weight: active ? 3.5 : 1.75,
          opacity: code && !active ? 0.2 : 0.85,
        });
      });
      layers.markers.forEach((marker, key) => {
        if (key === hub) return;
        const route = hubRoutes.find((r) => r.to === key);
        const color = route ? FREQUENCY_META[route.frequency].color : "#64748b";
        marker.setIcon(createDotIcon(color, key === code));
      });
    },
    [hub, hubRoutes]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 8,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      layersRef.current.lines.clear();
      layersRef.current.markers.clear();
      layersRef.current.regionalLines = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    layersRef.current.lines.forEach((line) => line.remove());
    layersRef.current.markers.forEach((marker) => marker.remove());
    layersRef.current.regionalLines.forEach((line) => line.remove());
    layersRef.current.lines.clear();
    layersRef.current.markers.clear();
    layersRef.current.regionalLines = [];

    const hubPoint = { lat: hubAirport.lat, lng: hubAirport.lng };

    hubRoutes.forEach((route) => {
      const dest = getAirport(route.to);
      if (!dest) return;

      const color = FREQUENCY_META[route.frequency].color;
      const line = L.polyline(buildCurvedLine(hubPoint, dest), {
        color,
        weight: 1.75,
        opacity: 0.85,
        lineCap: "round",
      });
      line.addTo(map);
      layersRef.current.lines.set(route.to, line);

      const marker = L.marker([dest.lat, dest.lng], {
        icon: createDotIcon(color, false),
      });
      marker.bindPopup(
        `<strong>${dest.code}</strong> ${dest.city}<br><span>${route.duration} · ${FREQUENCY_META[route.frequency].label}</span>`,
        ROUTE_MAP_POPUP_OPTIONS,
      );
      marker.on("click", () => setSelectedCode(route.to));
      marker.addTo(map);
      layersRef.current.markers.set(route.to, marker);
    });

    const hubMarker = L.marker([hubAirport.lat, hubAirport.lng], {
      icon: createDotIcon("#1a1a2e", true, true),
      zIndexOffset: 1000,
    });
    hubMarker.bindPopup(
      `<strong>${hub}</strong> ${hubAirport.city}<br><span>Хаб внутренних рейсов</span>`,
      ROUTE_MAP_POPUP_OPTIONS,
    );
    hubMarker.addTo(map);
    layersRef.current.markers.set(hub, hubMarker);

    if (showRegional) {
      REGIONAL_DIRECT_ROUTES.forEach((route) => {
        const from = getAirport(route.from);
        const to = getAirport(route.to);
        if (!from || !to) return;

        const line = L.polyline(buildCurvedLine(from, to, 0.12), {
          color: FREQUENCY_META.seasonal.color,
          weight: 1.5,
          opacity: 0.55,
          dashArray: "6 8",
          lineCap: "round",
        });
        line.bindPopup(
          `<strong>${route.from} ↔ ${route.to}</strong><br><span>${route.duration} · ${route.season}</span>`,
          ROUTE_MAP_POPUP_OPTIONS,
        );
        line.addTo(map);
        layersRef.current.regionalLines.push(line);
      });
    }

    const boundsCoords: [number, number][] = [
      [hubAirport.lat, hubAirport.lng],
      ...hubRoutes.flatMap((route) => {
        const dest = getAirport(route.to);
        return dest ? ([[dest.lat, dest.lng]] as [number, number][]) : [];
      }),
    ];
    map.fitBounds(L.latLngBounds(boundsCoords), { padding: [40, 40], maxZoom: 5 });
    setSelectedCode(null);
  }, [hub, hubAirport, hubRoutes, showRegional]);

  useEffect(() => {
    highlightRoute(selectedCode);
    if (!selectedCode || !mapRef.current) return;
    const dest = getAirport(selectedCode);
    if (dest) {
      mapRef.current.panTo([dest.lat, dest.lng], { animate: true, duration: 0.35 });
    }
  }, [selectedCode, highlightRoute]);

  const flightConnectionsUrl =
    hub === "AEP"
      ? "https://www.flightconnections.com/flights-from-aep-buenos-aires-aep"
      : "https://www.flightconnections.com/flights-from-eze-buenos-aires-eze";

  const selectedRoute = selectedCode ? hubRoutes.find((route) => route.to === selectedCode) : null;
  const selectedLabels = selectedCode
    ? resolveDomesticRouteLabels(hub, selectedCode)
    : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate">Хаб:</span>
          {(["AEP", "EZE"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setHub(code)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                hub === code
                  ? "bg-charcoal text-white"
                  : "border border-gray-200 bg-white text-charcoal hover:border-sky/40"
              )}
            >
              {code} · {ARGENTINA_DOMESTIC_AIRPORTS[code].city}
            </button>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate">
          <input
            type="checkbox"
            checked={showRegional}
            onChange={(e) => setShowRegional(e.target.checked)}
            className="rounded border-gray-300"
          />
          Сезонные прямые между регионами
        </label>
      </div>

      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="max-h-[360px] overflow-y-auto border-b border-gray-100 lg:border-b-0 lg:border-r">
          <p className="sticky top-0 z-10 border-b border-gray-50 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate">
            Прямые из {hub}
          </p>
          <ul className="divide-y divide-gray-50">
            {hubRoutes.map((route) => {
              const dest = getAirport(route.to);
              if (!dest) return null;
              const meta = FREQUENCY_META[route.frequency];
              const active = selectedCode === route.to;

              return (
                <li key={route.to}>
                  <button
                    type="button"
                    onClick={() => setSelectedCode(route.to === selectedCode ? null : route.to)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-muted/60",
                      active && "bg-sky/5"
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.color }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-charcoal">
                        {route.to}{" "}
                        <span className="font-normal text-slate">{dest.city}</span>
                      </p>
                      {route.note ? (
                        <p className="text-[11px] text-slate">{route.note}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-slate">{route.duration}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {selectedRoute && selectedLabels ? (
            <FlightRoutePriceHint
              origin={selectedLabels.origin}
              destination={selectedLabels.destination}
              originLabel={selectedLabels.originLabel}
              destinationLabel={selectedLabels.destinationLabel}
              routeId={`${hub.toLowerCase()}-${selectedRoute.to.toLowerCase()}`}
            />
          ) : null}
        </aside>

        <div className="relative">
          <div
            ref={containerRef}
            className="domestic-routes-canvas z-0 h-[320px] w-full sm:h-[360px]"
            role="img"
            aria-label={`Карта внутренних авиамаршрутов из ${hub}`}
          />
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-lg border border-gray-100 bg-white/95 px-2.5 py-2 shadow-sm backdrop-blur-sm">
            {(Object.entries(FREQUENCY_META) as [DomesticRouteFrequency, (typeof FREQUENCY_META)[DomesticRouteFrequency]][]).map(
              ([key, meta]) => (
                <span key={key} className="flex items-center gap-1 text-[10px] text-slate">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  {meta.label}
                </span>
              )
            )}
            {showRegional ? (
              <span className="flex items-center gap-1 text-[10px] text-slate">
                <span className="h-0.5 w-3 border-t-2 border-dashed border-orange-500" />
                Регион
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <p className="border-t border-gray-100 px-4 py-2.5 text-[11px] leading-relaxed text-slate">
        Данные ориентировочные по типичным маршрутам Aerolíneas Argentinas, JetSMART и Flybondi.
        {selectedLabels ? (
          <>
            {" "}
            Цены на {selectedLabels.originLabel} → {selectedLabels.destinationLabel}:{" "}
            <a
              href={buildFlightsSearchHref(selectedLabels.origin, selectedLabels.destination)}
              className="font-medium text-sky hover:underline"
            >
              Aviasales
            </a>
            . Расписание — на{" "}
          </>
        ) : (
          <> Расписание меняется — проверяйте актуальные рейсы на </>
        )}
        <a
          href={flightConnectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-medium text-sky hover:underline"
        >
          FlightConnections
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
        {selectedLabels ? null : <> или сайтах авиакомпаний</>}.
      </p>
    </div>
  );
}
