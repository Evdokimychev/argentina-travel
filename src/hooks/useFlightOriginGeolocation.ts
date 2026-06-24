"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_HOME_FLIGHT_ORIGIN,
  getFlightHubLabel,
} from "@/lib/flights/home-flight-hubs";
import { resolveNearestFlightOriginHub } from "@/lib/flights/nearest-flight-origin";

export type FlightOriginGeolocationState = {
  originCode: string;
  originLabel: string;
  geoResolved: boolean;
  geoLoading: boolean;
};

/** Подставляет город вылета: по умолчанию Москва, при успешной геолокации — ближайший хаб. */
export function useFlightOriginGeolocation(
  defaultOrigin: string = DEFAULT_HOME_FLIGHT_ORIGIN,
): FlightOriginGeolocationState {
  const [originCode, setOriginCode] = useState(defaultOrigin);
  const [originLabel, setOriginLabel] = useState(() => getFlightHubLabel(defaultOrigin));
  const [geoResolved, setGeoResolved] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const code = resolveNearestFlightOriginHub(
          position.coords.latitude,
          position.coords.longitude,
        );
        setOriginCode(code);
        setOriginLabel(getFlightHubLabel(code));
        setGeoResolved(true);
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
    );
  }, [defaultOrigin]);

  return { originCode, originLabel, geoResolved, geoLoading };
}
