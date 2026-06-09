export type OrganizerTourDiscountType = "early_by_date" | "early_by_days";

export const ORGANIZER_TOUR_DISCOUNT_OPTIONS: {
  id: OrganizerTourDiscountType;
  label: string;
  description: string;
  descriptionEmphasis?: string;
}[] = [
  {
    id: "early_by_date",
    label: "Скидка за раннее бронирование до указанной даты",
    description: "Применяется к заявкам, оформленным до выбранной даты окончания действия скидки",
    descriptionEmphasis: "включительно",
  },
  {
    id: "early_by_days",
    label: "Скидка за раннее бронирование до установленного количества дней до даты тура",
    description:
      "Применяется к заявкам, оформленным до установленного количества дней до даты начала тура",
  },
];
