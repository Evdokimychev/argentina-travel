import { ARGENTINA_AIRPORTS, type ArgentinaAirport } from "@/data/argentina-airports";

export type FlightRouteService = "regular" | "seasonal_or_limited";

export type ArgentinaFlightRoute = {
  from: string;
  to: string;
  service: FlightRouteService;
  durationMinutes?: number;
  airlines?: string[];
  frequencyNote?: string;
  verifiedAt: string;
  sourceUrl: string;
};

export type ArgentinaFlightConnection = {
  airport: ArgentinaAirport;
  route: ArgentinaFlightRoute;
};

/**
 * Редакционная выборка прямых внутренних маршрутов между аэропортами карты.
 * Это не расписание на конкретную дату: сезонные и малочастотные направления
 * могут быть доступны только в части года. Перед покупкой маршрут проверяется
 * в поиске авиабилетов.
 */
export const FLIGHT_ROUTES_VERIFIED_AT = "2026-07-19";

const FLIGHT_CONNECTIONS_BASE_URL = "https://www.flightconnections.com";

function airportSource(iata: string): string {
  const slugByIata: Record<string, string> = {
    AEP: "buenos-aires-aep",
    EZE: "buenos-aires-eze",
    COR: "c%C3%B3rdoba-cor",
    MDZ: "mendoza-mdz",
    BRC: "san-carlos-de-bariloche-brc",
    IGR: "puerto-iguaz%C3%BA-igr",
    SLA: "salta-sla",
    FTE: "el-calafate-fte",
    USH: "ushuaia-ush",
    REL: "trelew-rel",
    JUJ: "san-salvador-de-jujuy-juj",
    NQN: "neuqu%C3%A9n-nqn",
    TUC: "tucum%C3%A1n-tuc",
    ROS: "rosario-ros",
    MDQ: "mar-del-plata-mdq",
    BHI: "bah%C3%ADa-blanca-bhi",
    PSS: "posadas-pss",
    RES: "resistencia-res",
    CNQ: "corrientes-cnq",
    RGL: "r%C3%ADo-gallegos-rgl",
    CRD: "comodoro-rivadavia-crd",
    EQS: "esquel-eqs",
    UAQ: "san-juan-uaq",
    RGA: "r%C3%ADo-grande-rga",
    SDE: "santiago-del-estero-sde",
    CPC: "san-mart%C3%ADn-de-los-andes-cpc",
    PMY: "puerto-madryn-pmy",
    VDM: "viedma-vdm",
    PMQ: "perito-moreno-pmq",
    FMA: "formosa-fma",
    IRJ: "la-rioja-irj",
    CTC: "san-fernando-del-valle-de-catama-ctc",
    PRA: "paran%C3%A1-pra",
    SFN: "santa-fe-sfn",
    RCU: "r%C3%ADo-cuarto-rcu",
    LUQ: "san-luis-luq",
    RLO: "santa-rosa-de-conlara-rlo",
    AFA: "san-rafael-afa",
    RSA: "santa-rosa-rsa",
    RHD: "termas-de-r%C3%ADo-hondo-rhd",
  };
  return `${FLIGHT_CONNECTIONS_BASE_URL}/flights-from-${slugByIata[iata] ?? iata.toLowerCase()}`;
}

function route(
  from: string,
  to: string,
  options: Partial<Omit<ArgentinaFlightRoute, "from" | "to" | "verifiedAt" | "sourceUrl">> & {
    sourceUrl?: string;
  } = {},
): ArgentinaFlightRoute {
  return {
    from,
    to,
    service: options.service ?? "regular",
    durationMinutes: options.durationMinutes,
    airlines: options.airlines,
    frequencyNote: options.frequencyNote,
    verifiedAt: FLIGHT_ROUTES_VERIFIED_AT,
    sourceUrl: options.sourceUrl ?? airportSource(from),
  };
}

const AEP_DESTINATIONS = [
  "BRC", "FTE", "USH", "IGR", "MDZ", "SLA", "COR", "REL", "JUJ", "TUC", "NQN",
  "MDQ", "BHI", "PSS", "RES", "CNQ", "RGL", "CRD", "EQS", "UAQ", "RGA", "SDE", "ROS",
  "CPC", "PMY", "VDM", "FMA", "IRJ", "CTC", "PRA", "SFN", "RCU", "LUQ", "RLO", "AFA",
  "RSA", "RHD",
] as const;

const EZE_DESTINATIONS = [
  "BRC", "FTE", "USH", "IGR", "MDZ", "SLA", "COR", "REL", "JUJ", "TUC", "NQN",
  "MDQ", "BHI", "PSS", "RES", "CNQ", "RGL", "CRD", "EQS", "UAQ", "RGA", "SDE", "ROS",
  "CPC", "PMY", "VDM", "FMA", "IRJ", "CTC", "SFN", "LUQ", "AFA", "RHD",
] as const;

const HUB_ROUTES: ArgentinaFlightRoute[] = [
  ...AEP_DESTINATIONS.map((to) =>
    route("AEP", to, {
      service: ["RCU", "RLO", "RHD"].includes(to) ? "seasonal_or_limited" : "regular",
      durationMinutes: to === "CPC" ? 120 : undefined,
      airlines: to === "CPC" ? ["Aerolíneas Argentinas", "JetSmart"] : undefined,
      sourceUrl: to === "CPC" ? airportSource("CPC") : undefined,
    }),
  ),
  ...EZE_DESTINATIONS.map((to) =>
    route("EZE", to, {
      service: ["REL", "RGL", "EQS", "RGA", "SDE", "CNQ", "IRJ", "CTC", "SFN", "LUQ", "AFA", "RHD", "VDM"].includes(to)
        ? "seasonal_or_limited"
        : "regular",
      durationMinutes: to === "CPC" ? 120 : undefined,
      airlines: to === "CPC" ? ["Aerolíneas Argentinas", "JetSmart"] : undefined,
      sourceUrl: to === "CPC" ? airportSource("CPC") : undefined,
    }),
  ),
];

const REGIONAL_ROUTES: ArgentinaFlightRoute[] = [
  route("COR", "BRC", { service: "seasonal_or_limited" }),
  route("COR", "CRD"),
  route("COR", "EQS", { service: "seasonal_or_limited", durationMinutes: 140 }),
  route("COR", "FTE", { service: "seasonal_or_limited", durationMinutes: 195 }),
  route("COR", "IGR"),
  route("COR", "JUJ"),
  route("COR", "MDQ", { service: "seasonal_or_limited", durationMinutes: 110 }),
  route("COR", "MDZ"),
  route("COR", "NQN"),
  route("COR", "SLA"),
  route("COR", "TUC"),
  route("COR", "USH", { durationMinutes: 230 }),
  route("MDZ", "BRC", { service: "seasonal_or_limited" }),
  route("MDZ", "MDQ", { service: "seasonal_or_limited", durationMinutes: 130 }),
  route("MDZ", "NQN", { durationMinutes: 85 }),
  route("MDZ", "SLA", { durationMinutes: 105 }),
  route("BRC", "FTE", { service: "seasonal_or_limited", durationMinutes: 105 }),
  route("BRC", "ROS", { durationMinutes: 135 }),
  route("COR", "CPC", { durationMinutes: 110, airlines: ["Aerolíneas Argentinas"] }),
  route("ROS", "CPC", { durationMinutes: 120, airlines: ["Aerolíneas Argentinas"] }),
  route("IGR", "ROS", { durationMinutes: 110 }),
  route("IGR", "SLA", {
    durationMinutes: 125,
    airlines: ["Aerolíneas Argentinas"],
    frequencyNote: "Обычно около 2 рейсов в неделю; дни вылета меняются.",
    sourceUrl: `${FLIGHT_CONNECTIONS_BASE_URL}/flights-from-igr-to-sla`,
  }),
  route("SLA", "NQN", { durationMinutes: 147 }),
  route("SLA", "ROS"),
  route("FTE", "REL", { service: "seasonal_or_limited", durationMinutes: 105 }),
  route("FTE", "USH", { durationMinutes: 80 }),
  route("USH", "REL", { service: "seasonal_or_limited", durationMinutes: 130 }),
  route("NQN", "CRD", { durationMinutes: 90 }),
  route("IRJ", "CTC", { durationMinutes: 40, airlines: ["Aerolíneas Argentinas"] }),
  route("CRD", "PMQ", {
    service: "seasonal_or_limited",
    durationMinutes: 40,
    airlines: ["American Jet", "Euroairlines"],
    frequencyNote: "Обычно около 2 рейсов в неделю; расписание ограничено.",
  }),
  route("ROS", "MDQ", { service: "seasonal_or_limited", durationMinutes: 80 }),
  route("TUC", "MDQ", { service: "seasonal_or_limited", durationMinutes: 145 }),
];

export const ARGENTINA_FLIGHT_ROUTES: ArgentinaFlightRoute[] = [
  ...HUB_ROUTES,
  ...REGIONAL_ROUTES,
];

const AIRPORT_BY_IATA = new Map(ARGENTINA_AIRPORTS.map((airport) => [airport.iata, airport]));

function routeKey(from: string, to: string): string {
  return [from.trim().toUpperCase(), to.trim().toUpperCase()].sort().join("-");
}

const ROUTE_BY_PAIR = new Map(
  ARGENTINA_FLIGHT_ROUTES.map((item) => [routeKey(item.from, item.to), item]),
);

const CONNECTIONS_BY_IATA = new Map<string, ArgentinaFlightConnection[]>();
for (const item of ARGENTINA_FLIGHT_ROUTES) {
  const fromAirport = AIRPORT_BY_IATA.get(item.from);
  const toAirport = AIRPORT_BY_IATA.get(item.to);
  if (!fromAirport || !toAirport || item.from === item.to) continue;
  const fromConnections = CONNECTIONS_BY_IATA.get(item.from) ?? [];
  fromConnections.push({ airport: toAirport, route: item });
  CONNECTIONS_BY_IATA.set(item.from, fromConnections);
  const toConnections = CONNECTIONS_BY_IATA.get(item.to) ?? [];
  toConnections.push({ airport: fromAirport, route: item });
  CONNECTIONS_BY_IATA.set(item.to, toConnections);
}

/** Прямые направления из аэропорта, отсортированные с севера на юг. */
export function getFlightConnections(iata: string): ArgentinaFlightConnection[] {
  const code = iata.trim().toUpperCase();
  return [...(CONNECTIONS_BY_IATA.get(code) ?? [])].sort(
    (left, right) => right.airport.latitude - left.airport.latitude,
  );
}

/** Обратная совместимость для мест, которым нужны только аэропорты назначения. */
export function getFlightDestinations(iata: string): ArgentinaAirport[] {
  return getFlightConnections(iata).map((connection) => connection.airport);
}

export function getFlightRoute(from: string, to: string): ArgentinaFlightRoute | undefined {
  return ROUTE_BY_PAIR.get(routeKey(from, to));
}

export function hasFlightDestinations(iata: string): boolean {
  return getFlightConnections(iata).length > 0;
}
