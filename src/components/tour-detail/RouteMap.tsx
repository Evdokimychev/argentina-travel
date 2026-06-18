"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { TourRoutePoint } from "@/types";
import {
  getRoutePointRole,
  interpolateRoutePosition,
  type RoutePointRole,
} from "@/lib/tour-route-map";
import { cn } from "@/lib/cn";
import "leaflet/dist/leaflet.css";

interface RouteMapProps {
  points: TourRoutePoint[];
  selectedId?: string | null;
  progress?: number;
  onSelect?: (id: string) => void;
  fitToken?: number;
  className?: string;
}

function createMarkerIcon(role: RoutePointRole, order: number, active: boolean) {
  const label =
    role === "start" ? "С" : role === "finish" ? "Ф" : String(order);

  return L.divIcon({
    className: "",
    html: `<div class="route-map-marker route-map-marker--${role}${active ? " route-map-marker--active" : ""}">${label}</div>`,
    iconSize: role === "waypoint" ? [34, 34] : [38, 38],
    iconAnchor: role === "waypoint" ? [17, 17] : [19, 19],
    popupAnchor: [0, -20],
  });
}

function createRunnerIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="route-map-runner" aria-hidden="true"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function roleLabel(role: RoutePointRole): string {
  if (role === "start") return "Старт тура";
  if (role === "finish") return "Финиш тура";
  return "";
}

function buildPopupHtml(point: TourRoutePoint, role: RoutePointRole): string {
  const roleText = roleLabel(role);
  const dayText =
    point.dayNumber != null ? `<span>День ${point.dayNumber}</span>` : "";
  const roleBadge = roleText
    ? `<span class="route-map-popup-role route-map-popup-role--${role}">${roleText}</span>`
    : "";

  return `<strong>${point.name}</strong>${roleBadge}${dayText}`;
}

export default function RouteMap({
  points,
  selectedId,
  progress = 0,
  onSelect,
  fitToken = 0,
  className,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const completedLineRef = useRef<L.Polyline | null>(null);
  const remainingLineRef = useRef<L.Polyline | null>(null);
  const runnerRef = useRef<L.Marker | null>(null);
  const boundsRef = useRef<L.LatLngBounds | null>(null);
  const onSelectRef = useRef(onSelect);

  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markersRef.current.clear();
      completedLineRef.current = null;
      remainingLineRef.current = null;
      runnerRef.current = null;
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

    const coords: L.LatLngExpression[] = points.map((point) => [point.lat, point.lng]);
    const bounds = L.latLngBounds(coords);
    boundsRef.current = bounds;

    completedLineRef.current = L.polyline([], {
      color: "#2d4a3e",
      weight: 4,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    remainingLineRef.current = L.polyline(coords, {
      color: "#d4533b",
      weight: 3,
      opacity: 0.55,
      dashArray: "8 10",
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    runnerRef.current = L.marker([points[0].lat, points[0].lng], {
      icon: createRunnerIcon(),
      zIndexOffset: 1000,
      interactive: false,
    }).addTo(map);

    points.forEach((point, index) => {
      const role = getRoutePointRole(index, points.length);
      const marker = L.marker([point.lat, point.lng], {
        icon: createMarkerIcon(role, index + 1, false),
        zIndexOffset: 200 + index,
      });

      marker.bindPopup(buildPopupHtml(point, role), { className: "route-map-popup" });
      marker.on("click", () => onSelectRef.current?.(point.id));
      marker.addTo(map);
      markersRef.current.set(point.id, marker);
    });

    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 9 });
    mapRef.current = map;

    return () => {
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      completedLineRef.current = null;
      remainingLineRef.current = null;
      runnerRef.current = null;
      boundsRef.current = null;
    };
  }, [points]);

  useEffect(() => {
    if (!mapRef.current || points.length === 0) return;

    const interpolation = interpolateRoutePosition(points, progress);
    if (!interpolation) return;

    const completedCoords: L.LatLngExpression[] = [[points[0].lat, points[0].lng]];
    for (let index = 0; index < interpolation.segmentIndex; index += 1) {
      completedCoords.push([points[index + 1].lat, points[index + 1].lng]);
    }
    completedCoords.push([interpolation.lat, interpolation.lng]);

    const remainingCoords: L.LatLngExpression[] = [[interpolation.lat, interpolation.lng]];
    for (let index = interpolation.segmentIndex + 1; index < points.length; index += 1) {
      remainingCoords.push([points[index].lat, points[index].lng]);
    }

    completedLineRef.current?.setLatLngs(completedCoords);
    remainingLineRef.current?.setLatLngs(remainingCoords.length >= 2 ? remainingCoords : []);
    runnerRef.current?.setLatLng([interpolation.lat, interpolation.lng]);
  }, [progress, points]);

  useEffect(() => {
    if (!mapRef.current) return;

    points.forEach((point, index) => {
      const marker = markersRef.current.get(point.id);
      if (!marker) return;
      const role = getRoutePointRole(index, points.length);
      marker.setIcon(createMarkerIcon(role, index + 1, point.id === selectedId));
      if (point.id === selectedId) {
        marker.openPopup();
        mapRef.current?.panTo([point.lat, point.lng], { animate: true, duration: 0.4 });
      }
    });
  }, [selectedId, points]);

  useEffect(() => {
    if (!mapRef.current || !boundsRef.current || fitToken === 0) return;
    mapRef.current.fitBounds(boundsRef.current, { padding: [48, 48], maxZoom: 9 });
  }, [fitToken]);

  return (
    <div
      ref={containerRef}
      className={cn("route-map-canvas z-0 min-h-[288px] w-full", className)}
      role="img"
      aria-label="Интерактивная карта маршрута тура"
    />
  );
}
