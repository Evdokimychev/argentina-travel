import type { TourCustomBookingLink } from "@/types/tour-custom-booking-link";

export interface TourCustomBookingSeed {
  customBookingLink: Partial<TourCustomBookingLink>;
}

export const TOUR_CUSTOM_BOOKING_SEEDS: Record<string, TourCustomBookingSeed> = {
  "mendoza-wine": {
    customBookingLink: {
      enabled: true,
      url: "https://example-bodega.com/book/mendoza-wine-tour",
      label: "Забронировать на сайте винодельни",
      openInNewTab: true,
      hint: "Оплата и подтверждение дат — на сайте партнёра. Мы передадим выбранное количество гостей в ссылке.",
      passContext: true,
    },
  },
};

export function getCustomBookingSeedForSlug(slug: string): TourCustomBookingSeed | undefined {
  return TOUR_CUSTOM_BOOKING_SEEDS[slug];
}
