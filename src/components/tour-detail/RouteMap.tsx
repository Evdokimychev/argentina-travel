"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { TourRoutePoint } from "@/types";
import {
  buildRouteMapClusterPopupHtml,
  buildRouteMapPopupHtml,
  buildRouteMapSpiderfyPositions,
  clusterRoutePointsByScreenDistance,
  formatRouteMapClusterLabel,
  getRoutePointRole,
  interpolateRoutePosition,
  ROUTE_MAP_POPUP_OPTIONS,
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

function createMarkerIcon(
  role: ReturnType<typeof getRoutePointRole>,
  order: number,
  active: boolean,
  spiderfied = false,
) {
  const label =
    role === "start" ? "С" : role === "finish" ? "Ф" : String(order);

  return L.divIcon({
    className: "",
    html: `<div class="route-map-marker route-map-marker--${role}${active ? " route-map-marker--active" : ""}${spiderfied ? " route-map-marker--spider" : ""}">${label}</div>`,
    iconSize: role === "waypoint" ? [32, 32] : [36, 36],
    iconAnchor: role === "waypoint" ? [16, 16] : [18, 18],
    popupAnchor: [0, -18],
  });
}

function createClusterIcon(label: string, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="route-map-cluster${active ? " route-map-cluster--active" : ""}"><span class="route-map-cluster-stack" aria-hidden="true"></span><span class="route-map-cluster-count">${label}</span></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
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
  const spiderLinesRef = useRef<L.Polyline | null>(null);
  const completedLineRef = useRef<L.Polyline | null>(null);
  const remainingLineRef = useRef<L.Polyline | null>(null);
  const runnerRef = useRef<L.Marker | null>(null);
  const boundsRef = useRef<L.LatLngBounds | null>(null);
  const onSelectRef = useRef(onSelect);
  const [layoutRevision, setLayoutRevision] = useState(0);
  const [expandedClusterKey, setExpandedClusterKey] = useState<string | null>(null);

  onSelectRef.current = onSelect;

  const requestLayoutRefresh = useCallback(() => {
    setExpandedClusterKey(null);
    setLayoutRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch {
        /* Leaflet may touch detached DOM nodes during teardown */
      }
      mapRef.current = null;
      markersRef.current.clear();
      completedLineRef.current = null;
      remainingLineRef.current = null;
      runnerRef.current = null;
      spiderLinesRef.current = null;
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
      },
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
      color: "#c45a47",
      weight: 3,
      opacity: 0.45,
      dashArray: "7 9",
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    spiderLinesRef.current = L.polyline([], {
      color: "#d4533b",
      weight: 1.5,
      opacity: 0.35,
      dashArray: "3 6",
    }).addTo(map);

    runnerRef.current = L.marker([points[0].lat, points[0].lng], {
      icon: createRunnerIcon(),
      zIndexOffset: 1000,
      interactive: false,
    }).addTo(map);

    map.on("zoomend", requestLayoutRefresh);
    map.on("click", () => setExpandedClusterKey(null));

    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 9 });
    mapRef.current = map;
    setExpandedClusterKey(null);
    setLayoutRevision((value) => value + 1);

    return () => {
      map.off("zoomend", requestLayoutRefresh);
      markersRef.current.clear();
      try {
        if (mapRef.current) {
          mapRef.current.remove();
        }
      } catch {
        /* ignore teardown when container is already gone */
      }
      mapRef.current = null;
      completedLineRef.current = null;
      remainingLineRef.current = null;
      runnerRef.current = null;
      spiderLinesRef.current = null;
      boundsRef.current = null;
    };
  }, [points, requestLayoutRefresh]);

  useEffect(() => {
    if (!selectedId || !mapRef.current || points.length === 0) return;

    const selectedIndex = points.findIndex((point) => point.id === selectedId);
    if (selectedIndex < 0) return;

    const map = mapRef.current;
    const project = (index: number) => {
      const point = points[index]!;
      return map.latLngToContainerPoint([point.lat, point.lng]);
    };
    const groups = clusterRoutePointsByScreenDistance(points, project);
    const group = groups.find((item) => item.indices.includes(selectedIndex));
    if (group && group.indices.length > 1) {
      setExpandedClusterKey((current) => (current === group.key ? current : group.key));
    }
  }, [points, selectedId, layoutRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || points.length === 0) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
    spiderLinesRef.current?.setLatLngs([]);

    const project = (index: number) => {
      const point = points[index]!;
      return map.latLngToContainerPoint([point.lat, point.lng]);
    };

    const groups = clusterRoutePointsByScreenDistance(points, project);
    const selectedIndex = selectedId
      ? points.findIndex((point) => point.id === selectedId)
      : -1;

    for (const group of groups) {
      const isExpanded = expandedClusterKey === group.key && group.indices.length > 1;

      if (group.indices.length > 1 && !isExpanded) {
        const label = formatRouteMapClusterLabel(group.indices);
        const containsSelected = selectedIndex >= 0 && group.indices.includes(selectedIndex);
        const marker = L.marker([group.lat, group.lng], {
          icon: createClusterIcon(label, containsSelected),
          zIndexOffset: 600,
        });

        marker.bindPopup(
          buildRouteMapClusterPopupHtml(points, group.indices),
          { ...ROUTE_MAP_POPUP_OPTIONS, maxWidth: 300 },
        );
        marker.on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          setExpandedClusterKey(group.key);
          const clusterBounds = L.latLngBounds(
            group.indices.map((index) => [points[index]!.lat, points[index]!.lng]),
          );
          map.fitBounds(clusterBounds, {
            padding: [72, 72],
            maxZoom: Math.min(map.getZoom() + 1, 11),
            animate: true,
          });
        });
        marker.addTo(map);
        markersRef.current.set(`cluster-${group.key}`, marker);
        continue;
      }

      const centerPx = map.latLngToContainerPoint([group.lat, group.lng]);
      const spiderPositions =
        isExpanded && group.indices.length > 1
          ? buildRouteMapSpiderfyPositions(centerPx, group.indices.length)
          : null;

      if (spiderPositions) {
        const centerLatLng = map.containerPointToLatLng([centerPx.x, centerPx.y]);
        const spiderLegs: L.LatLngExpression[][] = spiderPositions.map((position) => [
          centerLatLng,
          map.containerPointToLatLng([position.x, position.y]),
        ]);
        spiderLinesRef.current?.setLatLngs(spiderLegs);
      }

      group.indices.forEach((pointIndex, spiderIndex) => {
        const point = points[pointIndex]!;
        const role = getRoutePointRole(pointIndex, points.length);
        const active = point.id === selectedId;
        const latLng = spiderPositions
          ? map.containerPointToLatLng([
              spiderPositions[spiderIndex]!.x,
              spiderPositions[spiderIndex]!.y,
            ])
          : L.latLng(point.lat, point.lng);

        const marker = L.marker(latLng, {
          icon: createMarkerIcon(role, pointIndex + 1, active, Boolean(spiderPositions)),
          zIndexOffset: 200 + pointIndex,
        });

        marker.bindPopup(buildRouteMapPopupHtml(point, role), ROUTE_MAP_POPUP_OPTIONS);
        marker.on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          onSelectRef.current?.(point.id);
        });
        marker.addTo(map);
        markersRef.current.set(point.id, marker);

        if (active) {
          marker.openPopup();
          map.panTo(latLng, { animate: true, duration: 0.4 });
        }
      });
    }
  }, [points, selectedId, expandedClusterKey, layoutRevision]);

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
    if (!mapRef.current || !boundsRef.current || fitToken === 0) return;
    mapRef.current.fitBounds(boundsRef.current, { padding: [48, 48], maxZoom: 9 });
    requestLayoutRefresh();
  }, [fitToken, requestLayoutRefresh]);

  return (
    <div
      ref={containerRef}
      className={cn("route-map-canvas z-0 min-h-[288px] w-full", className)}
      role="img"
      aria-label="Интерактивная карта маршрута тура"
    />
  );
}
