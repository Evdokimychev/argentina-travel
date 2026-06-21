/**
 * Transport hubs for the "Как добраться" map layer (Phase 2: domestic flight routes).
 * Linked to city place slugs from the Places catalog.
 */
export type TransportHubKind = "airport" | "bus_terminal" | "train_station";

export type ArgentinaTransportHub = {
  id: string;
  slug: string;
  kind: TransportHubKind;
  name: string;
  citySlug: string;
  cityName: string;
  region: string;
  latitude: number;
  longitude: number;
  description: string;
  placeSlug?: string;
  iata?: string;
};

export const ARGENTINA_TRANSPORT_HUBS: ArgentinaTransportHub[] = [
  {
    id: "hub-eze",
    slug: "ezeiza-airport",
    kind: "airport",
    name: "Аэропорт Эсейса (EZE)",
    citySlug: "buenos-aires",
    cityName: "Буэнос-Айрес",
    region: "Buenos Aires",
    latitude: -34.8222,
    longitude: -58.5358,
    description: "Международные рейсы и часть региональных.",
    iata: "EZE",
  },
  {
    id: "hub-aep",
    slug: "aeroparque-airport",
    kind: "airport",
    name: "Аэропарк (AEP)",
    citySlug: "buenos-aires",
    cityName: "Буэнос-Айрес",
    region: "Buenos Aires",
    latitude: -34.5592,
    longitude: -58.4156,
    description: "Внутренние рейсы и рейсы в соседние страны.",
    iata: "AEP",
  },
  {
    id: "hub-retiro-bus",
    slug: "retiro-bus-terminal",
    kind: "bus_terminal",
    name: "Автовокзал Retiro",
    citySlug: "buenos-aires",
    cityName: "Буэнос-Айрес",
    region: "Buenos Aires",
    latitude: -34.5894,
    longitude: -58.3814,
    description: "Главный автовокзал Буэнос-Айреса — дальние автобусы по стране.",
    placeSlug: "buenos-aires",
  },
  {
    id: "hub-brc-airport",
    slug: "bariloche-airport",
    kind: "airport",
    name: "Аэропорт Барилоче (BRC)",
    citySlug: "bariloche",
    cityName: "Барилоче",
    region: "Patagonia",
    latitude: -41.1511,
    longitude: -71.1575,
    description: "Региональные рейсы из Буэнос-Айреса и других городов.",
    iata: "BRC",
    placeSlug: "bariloche",
  },
  {
    id: "hub-igl-airport",
    slug: "iguazu-airport",
    kind: "airport",
    name: "Аэропорт Игуасу (IGR)",
    citySlug: "iguazu-falls",
    cityName: "Пуэрто-Игуасу",
    region: "Misiones",
    latitude: -25.7373,
    longitude: -54.4734,
    description: "Прямые рейсы из крупных городов Аргентины.",
    iata: "IGR",
    placeSlug: "iguazu-falls",
  },
  {
    id: "hub-ush-airport",
    slug: "ushuaia-airport",
    kind: "airport",
    name: "Аэропорт Уshuaia (USH)",
    citySlug: "ushuaia",
    cityName: "Уshuaia",
    region: "Tierra del Fuego",
    latitude: -54.8433,
    longitude: -68.2958,
    description: "Рейсы из Буэнос-Айреса и Патагонии.",
    iata: "USH",
    placeSlug: "ushuaia",
  },
];
