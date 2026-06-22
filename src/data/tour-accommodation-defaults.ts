import { tourGalleryImage } from "@/lib/seed-media";
import type { AccommodationDisplayMode } from "@/types/tour-accommodation";
import type { TourAccommodation } from "@/types/tour-accommodation";
import type { AccommodationType } from "@/types";
import {
  DEFAULT_BOOKING_LABEL,
  normalizeAccommodationAlternative,
  normalizeAccommodationPlace,
  normalizeAccommodationRoomType,
} from "@/lib/tour-accommodation-public";

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

export interface OrganizerTourAccommodationRoomType {
  id: string;
  name: string;
  description: string;
  capacity: number;
  priceUsdPerPerson: number;
  images: string[];
}

export interface OrganizerTourAccommodationAlternative {
  id: string;
  name: string;
  accommodationType: AccommodationType;
  description: string;
  images: string[];
  displayMode: AccommodationDisplayMode;
  bookingUrl?: string;
  bookingLabel?: string;
}

export interface OrganizerTourAccommodationPlace {
  id: string;
  nights: number;
  fullPeriod: boolean;
  name: string;
  accommodationType: AccommodationType;
  description: string;
  images: string[];
  displayMode: AccommodationDisplayMode;
  bookingUrl?: string;
  bookingLabel?: string;
  amenities: string[];
  roomTypes: OrganizerTourAccommodationRoomType[];
  alternatives: OrganizerTourAccommodationAlternative[];
}

export const IGUAZU_VARIANT_ACCOMMODATIONS = [
  {
    id: "iguazu-variant-hotel",
    name: "Отель 3* у национального парка Игуасу",
    description:
      "Ночёвка в отеле у входа в парк, завтрак включён. Удобная база для двухдневного маршрута с бразильской стороной.",
    comfort: "Комфорт" as const,
    accommodationType: "Отель" as const,
    amenities: ["Wi-Fi", "Завтрак", "Кондиционер", "Трансфер до парка"],
    images: [tourGalleryImage("iguazu-falls", 0)],
    displayMode: "manual" as const,
    roomTypes: [],
    alternatives: [],
  },
] satisfies TourAccommodation[];

export function createEmptyAccommodationRoomType(
  id?: string
): OrganizerTourAccommodationRoomType {
  return {
    id: id ?? `room-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    description: "",
    capacity: 2,
    priceUsdPerPerson: 0,
    images: [],
  };
}

export function createEmptyAccommodationAlternative(
  id?: string
): OrganizerTourAccommodationAlternative {
  return {
    id: id ?? `acc-alt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    accommodationType: "Отель",
    description: "",
    images: [],
    displayMode: "manual",
    bookingLabel: DEFAULT_BOOKING_LABEL,
  };
}

export function createEmptyAccommodationPlace(
  id?: string
): OrganizerTourAccommodationPlace {
  return normalizeAccommodationPlace({
    id: id ?? `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nights: 1,
    fullPeriod: true,
    name: "",
    accommodationType: "Отель",
    description: "",
    images: [],
    displayMode: "manual",
    bookingLabel: DEFAULT_BOOKING_LABEL,
    amenities: [],
    roomTypes: [],
    alternatives: [],
  });
}

export function mapTourAccommodationToPlace(
  accommodation: TourAccommodation
): OrganizerTourAccommodationPlace {
  return normalizeAccommodationPlace({
    id: accommodation.id,
    nights: accommodation.nights ?? 1,
    fullPeriod: accommodation.fullPeriod ?? true,
    name: accommodation.name,
    accommodationType: accommodation.accommodationType ?? "Отель",
    description: accommodation.description,
    images: accommodation.images,
    displayMode: accommodation.displayMode ?? "manual",
    bookingUrl: accommodation.bookingUrl,
    bookingLabel: accommodation.bookingLabel,
    amenities: accommodation.amenities,
    roomTypes: accommodation.roomTypes?.map((room) =>
      normalizeAccommodationRoomType({ ...room, id: room.id })
    ) ?? [],
    alternatives: accommodation.alternatives?.map((alt) =>
      normalizeAccommodationAlternative({ ...alt, id: alt.id })
    ) ?? [],
  });
}

/** @deprecated use createEmptyAccommodationPlace */
export function createEmptyAccommodation(id?: string): TourAccommodation {
  const place = createEmptyAccommodationPlace(id);
  return {
    id: place.id,
    name: place.name,
    description: place.description,
    comfort: "Комфорт",
    accommodationType: place.accommodationType,
    amenities: [],
    images: [],
    displayMode: "manual",
    roomTypes: [],
    alternatives: [],
  };
}

export { normalizeAccommodationPlace } from "@/lib/tour-accommodation-public";
export {
  ACCOMMODATION_AMENITY_PRESETS,
  ORGANIZER_TOUR_ACCOMMODATION_ROOM_TYPES_MAX,
  ROOM_TYPE_NAME_PRESETS,
  DEFAULT_BOOKING_LABEL,
} from "@/lib/tour-accommodation-public";
