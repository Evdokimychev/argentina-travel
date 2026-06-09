import { TourRoutePoint } from "@/types";

/** Geographic route stops keyed by tour slug — Supabase-ready mock data */
export const tourRoutesMap: Record<string, TourRoutePoint[]> = {
  "patagonia-glaciers": [
    {
      id: "ba",
      name: "Буэнос-Айрес",
      lat: -34.6037,
      lng: -58.3816,
      dayNumber: 1,
    },
    {
      id: "calafate",
      name: "Эль-Калафате",
      lat: -50.3378,
      lng: -72.2642,
      dayNumber: 2,
    },
    {
      id: "perito",
      name: "Ледник Перито-Морено",
      lat: -50.4967,
      lng: -73.0544,
      dayNumber: 3,
    },
    {
      id: "tdp",
      name: "Torres del Paine",
      lat: -51.0803,
      lng: -72.9636,
      dayNumber: 5,
    },
  ],
  "buenos-aires-tango": [
    {
      id: "centro",
      name: "Центр и Puerto Madero",
      lat: -34.6037,
      lng: -58.3816,
      dayNumber: 1,
    },
    {
      id: "san-telmo",
      name: "San Telmo",
      lat: -34.6211,
      lng: -58.3731,
      dayNumber: 2,
    },
    {
      id: "la-boca",
      name: "La Boca",
      lat: -34.6345,
      lng: -58.3632,
      dayNumber: 3,
    },
    {
      id: "recoleta",
      name: "Recoleta",
      lat: -34.5875,
      lng: -58.3974,
      dayNumber: 4,
    },
    {
      id: "palermo",
      name: "Palermo",
      lat: -34.5889,
      lng: -58.4307,
      dayNumber: 5,
    },
  ],
  "mendoza-wine": [
    {
      id: "mendoza",
      name: "Мендоса",
      lat: -32.8908,
      lng: -68.8272,
      dayNumber: 1,
    },
    {
      id: "maipu",
      name: "Maipú",
      lat: -33.015,
      lng: -68.735,
      dayNumber: 2,
    },
    {
      id: "aconcagua",
      name: "Аконкагуа",
      lat: -32.653,
      lng: -70.011,
      dayNumber: 4,
    },
    {
      id: "uco",
      name: "Долина Uco",
      lat: -33.567,
      lng: -69.083,
      dayNumber: 6,
    },
  ],
  "iguazu-falls": [
    {
      id: "puerto",
      name: "Puerto Iguazú",
      lat: -25.5953,
      lng: -54.5785,
      dayNumber: 1,
    },
    {
      id: "arg-side",
      name: "Водопады (арг. сторона)",
      lat: -25.6953,
      lng: -54.4367,
      dayNumber: 2,
    },
    {
      id: "devils-throat",
      name: "Garganta del Diablo",
      lat: -25.6911,
      lng: -54.4417,
      dayNumber: 3,
    },
    {
      id: "brazil-side",
      name: "Вид с браз. стороны",
      lat: -25.6872,
      lng: -54.4442,
      dayNumber: 4,
    },
  ],
  "salta-northwest": [
    {
      id: "salta",
      name: "Сальта",
      lat: -24.7821,
      lng: -65.4232,
      dayNumber: 1,
    },
    {
      id: "conchas",
      name: "Quebrada de las Conchas",
      lat: -25.865,
      lng: -65.908,
      dayNumber: 3,
    },
    {
      id: "cafayate",
      name: "Кафаяте",
      lat: -26.0667,
      lng: -65.9833,
      dayNumber: 5,
    },
    {
      id: "salinas",
      name: "Salinas Grandes",
      lat: -23.758,
      lng: -66.085,
      dayNumber: 7,
    },
  ],
  "ushuaia-end-of-world": [
    {
      id: "ushuaia",
      name: "Ушуайя",
      lat: -54.8019,
      lng: -68.303,
      dayNumber: 1,
    },
    {
      id: "beagle",
      name: "Канал Бигля",
      lat: -54.831,
      lng: -68.303,
      dayNumber: 2,
    },
    {
      id: "tdf",
      name: "Tierra del Fuego",
      lat: -54.845,
      lng: -68.324,
      dayNumber: 4,
    },
    {
      id: "train",
      name: "Поезд End of the World",
      lat: -54.852,
      lng: -68.303,
      dayNumber: 5,
    },
  ],
};

export function getTourRoutePoints(slug: string): TourRoutePoint[] {
  return tourRoutesMap[slug] ?? [];
}
