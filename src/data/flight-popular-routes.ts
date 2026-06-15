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
    id: "mow-igr",
    origin: "MOW",
    originLabel: "Москва",
    destination: "IGR",
    destinationLabel: "Игуасу",
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
    destinationLabel: "Ушуая",
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
];
