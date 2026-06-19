import type { TransferLocation } from "@/lib/intui/types";

export const TRANSFER_LOCATIONS: TransferLocation[] = [
  {
    id: "eze",
    name: "Аэропорт EZE (Эсейса)",
    type: "airport",
    code: "EZE",
    lat: -34.8222,
    lng: -58.5358,
    countryName: "Аргентина",
  },
  {
    id: "aep",
    name: "Аэропорт AEP (Аэропарке)",
    type: "airport",
    code: "AEP",
    lat: -34.5592,
    lng: -58.4156,
    countryName: "Аргентина",
  },
  {
    id: "brc",
    name: "Аэропорт BRC (Барилоче)",
    type: "airport",
    code: "BRC",
    lat: -41.1512,
    lng: -71.1575,
    countryName: "Аргентина",
  },
  {
    id: "ba-center",
    name: "Буэнос-Айрес, центр (Микроцентро)",
    type: "point",
    lat: -34.6037,
    lng: -58.3816,
    countryName: "Аргентина",
  },
  {
    id: "palermo",
    name: "Буэнос-Айрес, Палермо",
    type: "point",
    lat: -34.5875,
    lng: -58.4253,
    countryName: "Аргентина",
  },
  {
    id: "recoleta",
    name: "Буэнос-Айрес, Реколета",
    type: "point",
    lat: -34.5874,
    lng: -58.3926,
    countryName: "Аргентина",
  },
  {
    id: "san-telmo",
    name: "Буэнос-Айрес, Сан-Тельмо",
    type: "point",
    lat: -34.6212,
    lng: -58.3731,
    countryName: "Аргентина",
  },
  {
    id: "bariloche-center",
    name: "Барилоче, центр",
    type: "point",
    lat: -41.1335,
    lng: -71.3103,
    countryName: "Аргентина",
  },
];

export function getTransferLocationById(id: string): TransferLocation | undefined {
  return TRANSFER_LOCATIONS.find((location) => location.id === id);
}

export function searchTransferLocations(term: string): TransferLocation[] {
  const query = term.trim().toLowerCase();
  if (query.length < 2) return [];

  return TRANSFER_LOCATIONS.filter((location) => {
    const haystack = [
      location.name,
      location.code,
      location.countryName,
      location.id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  }).slice(0, 8);
}

export function formatTransferLocationLabel(location: TransferLocation): string {
  const parts = [location.name];
  if (location.countryName) parts.push(location.countryName);
  if (location.code) {
    return `${parts.join(", ")} (${location.code})`;
  }
  return parts.join(", ");
}
