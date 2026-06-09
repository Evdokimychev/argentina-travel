import type { TourAccommodation } from "@/types";
import type { AccommodationType } from "@/types";

export const ORGANIZER_TOUR_ACCOMMODATION_DESCRIPTION_MAX = 1000;
export const ORGANIZER_TOUR_ACCOMMODATION_PHOTOS_MAX = 10;

export const DEFAULT_IGUAZU_ACCOMMODATION_DESCRIPTION =
  "Однодневный тур без проживания в гостинице";

export const ACCOMMODATION_VARIANT_NOT_FILLED = "Не заполнено";

export const ORGANIZER_TOUR_ACCOMMODATIONS_MAX = 10;
export const ORGANIZER_TOUR_ACCOMMODATION_AMENITIES_MAX = 12;
export const ORGANIZER_TOUR_ACCOMMODATION_PLACE_DESCRIPTION_MAX = 2000;
export const ORGANIZER_TOUR_ACCOMMODATION_ALTERNATIVES_MAX = 5;

export const ACCOMMODATION_NAME_PRESETS = [
  "Отель «Турист»",
  "Lodge у национального парка",
  "Гостевой дом",
  "Апартаменты в центре",
  "Глэмпинг",
] as const;

export interface OrganizerTourAccommodationAlternative {
  id: string;
  name: string;
  accommodationType: AccommodationType;
  description: string;
  images: string[];
}

export interface OrganizerTourAccommodationPlace {
  id: string;
  nights: number;
  fullPeriod: boolean;
  name: string;
  accommodationType: AccommodationType;
  description: string;
  images: string[];
  alternatives: OrganizerTourAccommodationAlternative[];
}

export const IGUAZU_VARIANT_ACCOMMODATIONS = [
  {
    id: "iguazu-variant-hotel",
    name: "Отель 3* у национального парка Игуасу",
    description:
      "Ночёвка в отеле у входа в парк, завтрак включён. Удобная база для двухдневного маршрута с бразильской стороной.",
    comfort: "Комфорт" as const,
    amenities: ["Wi-Fi", "Завтрак", "Кондиционер", "Трансфер до парка"],
    images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80"],
  },
] satisfies TourAccommodation[];

export function createEmptyAccommodationAlternative(
  id?: string
): OrganizerTourAccommodationAlternative {
  return {
    id: id ?? `acc-alt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    accommodationType: "Отель",
    description: "",
    images: [],
  };
}

export function createEmptyAccommodationPlace(
  id?: string
): OrganizerTourAccommodationPlace {
  return {
    id: id ?? `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nights: 1,
    fullPeriod: true,
    name: "",
    accommodationType: "Отель",
    description: "",
    images: [],
    alternatives: [],
  };
}

export function mapTourAccommodationToPlace(
  accommodation: TourAccommodation
): OrganizerTourAccommodationPlace {
  return {
    id: accommodation.id,
    nights: 1,
    fullPeriod: true,
    name: accommodation.name,
    accommodationType: "Отель",
    description: accommodation.description,
    images: accommodation.images,
    alternatives: [],
  };
}

/** @deprecated use createEmptyAccommodationPlace */
export function createEmptyAccommodation(id?: string): TourAccommodation {
  return {
    id: id ?? `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    description: "",
    comfort: "Комфорт",
    amenities: [],
    images: [],
  };
}
