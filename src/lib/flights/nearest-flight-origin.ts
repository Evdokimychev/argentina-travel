import { haversineKm } from "@/lib/tour-route-map";
import { DEFAULT_HOME_FLIGHT_ORIGIN } from "@/lib/flights/home-flight-hubs";

/** Координаты центров городов для Aviasales origin hubs. */
const ORIGIN_HUB_COORDS: Record<string, { lat: number; lng: number }> = {
  MOW: { lat: 55.7558, lng: 37.6173 },
  LED: { lat: 59.9343, lng: 30.3351 },
  SVX: { lat: 56.8389, lng: 60.6057 },
  OVB: { lat: 55.0084, lng: 82.9357 },
  IST: { lat: 41.0082, lng: 28.9784 },
  MAD: { lat: 40.4168, lng: -3.7038 },
  MIA: { lat: 25.7617, lng: -80.1918 },
  GRU: { lat: -23.5505, lng: -46.6333 },
  SCL: { lat: -33.4489, lng: -70.6693 },
  BUE: { lat: -34.6037, lng: -58.3816 },
  RIO: { lat: -22.9068, lng: -43.1729 },
  SAO: { lat: -23.5505, lng: -46.6333 },
};

/** Ближайший хаб вылета по координатам браузера. */
export function resolveNearestFlightOriginHub(lat: number, lng: number): string {
  let bestCode = DEFAULT_HOME_FLIGHT_ORIGIN;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const [code, coords] of Object.entries(ORIGIN_HUB_COORDS)) {
    const distance = haversineKm({ lat, lng }, coords);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestCode = code;
    }
  }

  return bestCode;
}
