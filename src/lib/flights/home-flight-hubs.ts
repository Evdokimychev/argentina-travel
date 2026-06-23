import { FLIGHT_POPULAR_ROUTES } from "@/data/flight-popular-routes";
import { ARGENTINA_DOMESTIC_AIRPORTS } from "@/data/argentina-domestic-routes";

export type FlightHubOption = {
  code: string;
  label: string;
};

export type FlightHubPickerSections = {
  popular: FlightHubOption[];
  all: FlightHubOption[];
};

/** Aviasales metro code for Buenos Aires (AEP + EZE). */
const BUE_METRO: FlightHubOption = { code: "BUE", label: "Буэнос-Айрес" };

/**
 * Popular Argentina hubs — order matches home popular routes and destination guides.
 * BUE metro replaces individual AEP/EZE in search UI.
 */
export const POPULAR_ARGENTINA_HUB_CODES = [
  "BUE",
  "BRC",
  "IGR",
  "FTE",
  "USH",
  "MDZ",
  "SLA",
  "COR",
  "ROS",
] as const;

/** International origins for «Откуда» (Aviasales city codes). */
const INTERNATIONAL_ORIGIN_HUBS: FlightHubOption[] = [
  { code: "MOW", label: "Москва" },
  { code: "LED", label: "Санкт-Петербург" },
  { code: "SVX", label: "Екатеринбург" },
  { code: "OVB", label: "Новосибирск" },
  { code: "IST", label: "Стамбул" },
  { code: "MAD", label: "Мадрид" },
  { code: "MIA", label: "Майами" },
  { code: "GRU", label: "Сан-Паулу" },
  { code: "SCL", label: "Сантьяго" },
];

/**
 * All Argentina airports with scheduled passenger service (FlightConnections, 2025).
 * AEP/EZE omitted — use BUE metro for Aviasales.
 */
const ARGENTINA_AIRPORT_HUBS: FlightHubOption[] = [
  BUE_METRO,
  { code: "AFA", label: "Сан-Рафаэль" },
  { code: "BHI", label: "Баия-Бланка" },
  { code: "BRC", label: "Барилоче" },
  { code: "CNQ", label: "Корриентес" },
  { code: "COR", label: "Кордова" },
  { code: "CPC", label: "Сан-Мартин-де-лос-Андес" },
  { code: "CRD", label: "Комодоро-Ривадавия" },
  { code: "CTC", label: "Катамарка" },
  { code: "EQS", label: "Эскель" },
  { code: "FMA", label: "Формоса" },
  { code: "FTE", label: "Эль-Калафате" },
  { code: "IGR", label: "Игуасу" },
  { code: "IRJ", label: "Ла-Риоха" },
  { code: "JUJ", label: "Хухуй" },
  { code: "LUQ", label: "Сан-Луис" },
  { code: "MDQ", label: "Мар-дель-Плата" },
  { code: "MDZ", label: "Мендоса" },
  { code: "NQN", label: "Неукен" },
  { code: "PMY", label: "Пуэрто-Мадрин" },
  { code: "PRA", label: "Парана" },
  { code: "PSS", label: "Посадас" },
  { code: "RCU", label: "Рио-Куарто" },
  { code: "REL", label: "Трелю" },
  { code: "RGA", label: "Рио-Гранде" },
  { code: "RGL", label: "Рио-Галегос" },
  { code: "RHD", label: "Термас-де-Рио-Ондо" },
  { code: "RLO", label: "Конлара" },
  { code: "ROS", label: "Росарио" },
  { code: "RSA", label: "Санта-Роса" },
  { code: "SDE", label: "Сантьяго-дель-Эстеро" },
  { code: "SFN", label: "Санта-Фе" },
  { code: "SLA", label: "Сальта" },
  { code: "TUC", label: "Тукуман" },
  { code: "UAQ", label: "Сан-Хуан" },
  { code: "USH", label: "Ушуайя" },
  { code: "VDM", label: "Вьедма" },
  { code: "RES", label: "Ресистенсия" },
];

function mergeDomesticLabels(hubs: FlightHubOption[]): FlightHubOption[] {
  return hubs.map((hub) => {
    const domestic = ARGENTINA_DOMESTIC_AIRPORTS[hub.code];
    if (!domestic) return hub;
    return { code: hub.code, label: domestic.city };
  });
}

function mergePopularRouteLabels(hubs: FlightHubOption[]): FlightHubOption[] {
  const routeLabels = new Map<string, string>();
  for (const route of FLIGHT_POPULAR_ROUTES) {
    routeLabels.set(route.origin, route.originLabel);
    routeLabels.set(route.destination, route.destinationLabel);
  }
  return hubs.map((hub) => ({
    code: hub.code,
    label: routeLabels.get(hub.code) ?? hub.label,
  }));
}

const ARGENTINA_HUBS = mergePopularRouteLabels(mergeDomesticLabels(ARGENTINA_AIRPORT_HUBS));

const ARGENTINA_HUB_BY_CODE = new Map(ARGENTINA_HUBS.map((hub) => [hub.code, hub]));

const ALL_HUB_BY_CODE = new Map<string, FlightHubOption>([
  ...ARGENTINA_HUBS.map((hub) => [hub.code, hub] as const),
  ...INTERNATIONAL_ORIGIN_HUBS.map((hub) => [hub.code, hub] as const),
]);

function sortByLabel(hubs: FlightHubOption[]): FlightHubOption[] {
  return [...hubs].sort((a, b) => a.label.localeCompare(b.label, "ru"));
}

function pickPopularArgentinaHubs(): FlightHubOption[] {
  return POPULAR_ARGENTINA_HUB_CODES.map((code) => ARGENTINA_HUB_BY_CODE.get(code)).filter(
    (hub): hub is FlightHubOption => Boolean(hub),
  );
}

function pickRemainingArgentinaHubs(exclude: Set<string>): FlightHubOption[] {
  return sortByLabel(ARGENTINA_HUBS.filter((hub) => !exclude.has(hub.code)));
}

export function getFlightHubPickerSections(kind: "origin" | "destination"): FlightHubPickerSections {
  const popularAr = pickPopularArgentinaHubs();
  const popularCodes = new Set(popularAr.map((hub) => hub.code));

  if (kind === "destination") {
    return {
      popular: popularAr,
      all: pickRemainingArgentinaHubs(popularCodes),
    };
  }

  const popularOrigin = [
    INTERNATIONAL_ORIGIN_HUBS.find((hub) => hub.code === "MOW")!,
    ...popularAr.filter((hub) => hub.code === "BUE"),
  ];
  const originPopularCodes = new Set(popularOrigin.map((hub) => hub.code));
  const remainingInternational = sortByLabel(
    INTERNATIONAL_ORIGIN_HUBS.filter((hub) => !originPopularCodes.has(hub.code)),
  );
  const remainingArgentina = pickRemainingArgentinaHubs(
    new Set([...popularCodes].filter((code) => code !== "BUE")),
  );

  return {
    popular: popularOrigin,
    all: [...remainingInternational, ...remainingArgentina],
  };
}

/** Flat list of all hubs for a picker kind (popular first, then alphabetical). */
export function getFlightHubOptions(kind: "origin" | "destination" = "destination"): FlightHubOption[] {
  const { popular, all } = getFlightHubPickerSections(kind);
  return [...popular, ...all];
}

export function getFlightHubLabel(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (normalized === "AEP" || normalized === "EZE") return BUE_METRO.label;
  return ALL_HUB_BY_CODE.get(normalized)?.label ?? normalized;
}

export const DEFAULT_HOME_FLIGHT_ORIGIN = "MOW";
export const DEFAULT_HOME_FLIGHT_DESTINATION = "BUE";

export const ARGENTINA_AIRPORT_COUNT = ARGENTINA_HUBS.length;
