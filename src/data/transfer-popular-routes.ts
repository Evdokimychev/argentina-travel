export type TransferPopularRoute = {
  id: string;
  originId: string;
  destinationId: string;
  originLabel: string;
  destinationLabel: string;
};

export const TRANSFER_POPULAR_ROUTES: TransferPopularRoute[] = [
  {
    id: "eze-ba-center",
    originId: "eze",
    destinationId: "ba-center",
    originLabel: "EZE",
    destinationLabel: "Центр Буэнос-Айреса",
  },
  {
    id: "eze-palermo",
    originId: "eze",
    destinationId: "palermo",
    originLabel: "EZE",
    destinationLabel: "Палермо",
  },
  {
    id: "aep-ba-center",
    originId: "aep",
    destinationId: "ba-center",
    originLabel: "AEP",
    destinationLabel: "Центр Буэнос-Айреса",
  },
  {
    id: "eze-brc",
    originId: "eze",
    destinationId: "brc",
    originLabel: "EZE",
    destinationLabel: "Барилоче (BRC)",
  },
];
