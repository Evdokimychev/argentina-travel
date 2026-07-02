import { ARGENTINA_AIRPORTS, type ArgentinaAirport } from "@/data/argentina-airports";

/**
 * Внутренние авиамаршруты Аргентины (регулярные направления по IATA-кодам).
 * Список — ориентир для планирования: расписания меняются по сезонам,
 * актуальные рейсы проверяйте у авиакомпаний.
 */
const FLIGHT_ROUTES_ONE_WAY: Record<string, string[]> = {
  AEP: [
    "BRC",
    "FTE",
    "USH",
    "IGR",
    "MDZ",
    "SLA",
    "COR",
    "REL",
    "JUJ",
    "TUC",
    "NQN",
    "MDQ",
    "BHI",
    "PSS",
    "RES",
    "CNQ",
    "RGL",
    "CRD",
    "EQS",
    "UAQ",
    "RGA",
    "SDE",
    "ROS",
  ],
  EZE: ["BRC", "FTE", "USH", "IGR", "MDZ", "SLA", "COR"],
  COR: ["BRC", "IGR", "MDZ", "SLA", "NQN", "ROS"],
  FTE: ["USH"],
  ROS: ["IGR"],
};

function buildSymmetricRoutes(): Record<string, Set<string>> {
  const routes: Record<string, Set<string>> = {};
  const add = (from: string, to: string) => {
    if (from === to) return;
    (routes[from] ??= new Set()).add(to);
    (routes[to] ??= new Set()).add(from);
  };
  for (const [from, targets] of Object.entries(FLIGHT_ROUTES_ONE_WAY)) {
    for (const to of targets) add(from, to);
  }
  return routes;
}

const FLIGHT_ROUTES = buildSymmetricRoutes();

const AIRPORT_BY_IATA = new Map(ARGENTINA_AIRPORTS.map((airport) => [airport.iata, airport]));

/** Аэропорты, куда есть прямые рейсы из указанного (отсортированы с севера на юг). */
export function getFlightDestinations(iata: string): ArgentinaAirport[] {
  const targets = FLIGHT_ROUTES[iata.trim().toUpperCase()];
  if (!targets) return [];
  return [...targets]
    .map((code) => AIRPORT_BY_IATA.get(code))
    .filter((airport): airport is ArgentinaAirport => Boolean(airport))
    .sort((a, b) => b.latitude - a.latitude);
}

export function hasFlightDestinations(iata: string): boolean {
  return (FLIGHT_ROUTES[iata.trim().toUpperCase()]?.size ?? 0) > 0;
}
