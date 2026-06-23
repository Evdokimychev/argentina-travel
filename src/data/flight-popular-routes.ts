export type FlightPopularRoute = {
  id: string;
  origin: string;
  originLabel: string;
  destination: string;
  destinationLabel: string;
};

export const FLIGHT_POPULAR_ROUTES: FlightPopularRoute[] = [
  {
    id: "mow-bue",
    origin: "MOW",
    originLabel: "Москва",
    destination: "BUE",
    destinationLabel: "Буэнос-Айрес",
  },
  {
    id: "bue-brc",
    origin: "BUE",
    originLabel: "Буэнос-Айрес",
    destination: "BRC",
    destinationLabel: "Барилоче",
  },
  {
    id: "bue-ush",
    origin: "BUE",
    originLabel: "Буэнос-Айрес",
    destination: "USH",
    destinationLabel: "Ушуайя",
  },
  {
    id: "bue-fte",
    origin: "BUE",
    originLabel: "Буэнос-Айрес",
    destination: "FTE",
    destinationLabel: "Эль-Калафате",
  },
  {
    id: "bue-sla",
    origin: "BUE",
    originLabel: "Буэнос-Айрес",
    destination: "SLA",
    destinationLabel: "Сальта",
  },
  {
    id: "bue-mdz",
    origin: "BUE",
    originLabel: "Буэнос-Айрес",
    destination: "MDZ",
    destinationLabel: "Мендоса",
  },
  {
    id: "bue-igr",
    origin: "BUE",
    originLabel: "Буэнос-Айрес",
    destination: "IGR",
    destinationLabel: "Игуасу",
  },
];

export function getFlightPopularRouteGroups(): {
  international: FlightPopularRoute[];
  domestic: FlightPopularRoute[];
} {
  return {
    international: FLIGHT_POPULAR_ROUTES.filter((route) => route.origin !== "BUE"),
    domestic: FLIGHT_POPULAR_ROUTES.filter((route) => route.origin === "BUE"),
  };
}

export function getFlightRouteById(routeId: string): FlightPopularRoute | undefined {
  return FLIGHT_POPULAR_ROUTES.find((route) => route.id === routeId);
}

export function buildFlightRouteHref(routeId: string): string {
  return `/flights/${routeId}`;
}

export function getRelatedFlightRoutes(routeId: string, limit = 4): FlightPopularRoute[] {
  const current = getFlightRouteById(routeId);
  if (!current) return [];

  return FLIGHT_POPULAR_ROUTES.filter(
    (route) =>
      route.id !== routeId &&
      (route.origin === current.origin ||
        route.destination === current.destination ||
        route.origin === current.destination ||
        route.destination === current.origin)
  ).slice(0, limit);
}
