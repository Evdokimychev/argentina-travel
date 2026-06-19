import type {
  AccommodationDisplayMode,
  TourAccommodation,
  TourAccommodationAlternative,
  TourAccommodationRoomType,
} from "@/types/tour-accommodation";
import type { AccommodationType, ComfortLevel } from "@/types";
import type { OrganizerTourAccommodationPlace } from "@/data/tour-accommodation-defaults";

export const DEFAULT_BOOKING_LABEL = "Посмотреть на Booking.com";

export const ACCOMMODATION_AMENITY_PRESETS = [
  "Wi-Fi",
  "Завтрак",
  "Кондиционер",
  "Отопление",
  "Сейф",
  "Прачечная",
  "Трансфер до парка",
  "Завтрак и ужин",
] as const;

export const ROOM_TYPE_NAME_PRESETS = [
  "Одноместный номер",
  "Номер с двумя кроватями",
  "Двухместный номер",
  "Трёхместный номер",
  "Номер категории 4★",
  "Номер категории 5★",
] as const;

export const ORGANIZER_TOUR_ACCOMMODATION_ROOM_TYPES_MAX = 8;

const BOOKING_HOST_PATTERN = /^(?:www\.)?booking\.com$/i;

export function isAllowedBookingUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    return BOOKING_HOST_PATTERN.test(parsed.hostname);
  } catch {
    return false;
  }
}

export function normalizeAccommodationDisplayMode(
  value: AccommodationDisplayMode | undefined
): AccommodationDisplayMode {
  return value === "booking_link" ? "booking_link" : "manual";
}

export function normalizeAccommodationRoomType(
  room: Partial<TourAccommodationRoomType> & { id: string }
): TourAccommodationRoomType {
  return {
    id: room.id,
    name: room.name?.trim() ?? "",
    description: room.description?.trim() ?? "",
    capacity: Math.max(1, room.capacity ?? 2),
    priceUsdPerPerson: Math.max(0, room.priceUsdPerPerson ?? 0),
    images: (room.images ?? []).filter(Boolean),
  };
}

export function normalizeAccommodationAlternative(
  alt: Partial<TourAccommodationAlternative> & { id: string }
): TourAccommodationAlternative {
  const displayMode = normalizeAccommodationDisplayMode(alt.displayMode);
  const bookingUrl = alt.bookingUrl?.trim();
  return {
    id: alt.id,
    name: alt.name?.trim() ?? "",
    accommodationType: alt.accommodationType ?? "Отель",
    description: alt.description?.trim() ?? "",
    images: (alt.images ?? []).filter(Boolean),
    displayMode,
    bookingUrl: displayMode === "booking_link" && bookingUrl ? bookingUrl : undefined,
    bookingLabel: alt.bookingLabel?.trim() || DEFAULT_BOOKING_LABEL,
  };
}

export function normalizeAccommodationPlace(
  place: Partial<OrganizerTourAccommodationPlace> & { id: string }
): OrganizerTourAccommodationPlace {
  const displayMode = normalizeAccommodationDisplayMode(place.displayMode);
  const bookingUrl = place.bookingUrl?.trim();
  return {
    id: place.id,
    nights: Math.max(1, place.nights ?? 1),
    fullPeriod: place.fullPeriod ?? true,
    name: place.name?.trim() ?? "",
    accommodationType: place.accommodationType ?? "Отель",
    description: place.description?.trim() ?? "",
    images: (place.images ?? []).filter(Boolean),
    displayMode,
    bookingUrl: displayMode === "booking_link" && bookingUrl ? bookingUrl : undefined,
    bookingLabel: place.bookingLabel?.trim() || DEFAULT_BOOKING_LABEL,
    amenities: (place.amenities ?? []).map((item) => item.trim()).filter(Boolean),
    roomTypes: (place.roomTypes ?? []).map((room) =>
      normalizeAccommodationRoomType({ ...room, id: room.id })
    ),
    alternatives: (place.alternatives ?? []).map((alt) =>
      normalizeAccommodationAlternative({ ...alt, id: alt.id })
    ),
  };
}

export function mapAccommodationPlaceToPublic(
  place: OrganizerTourAccommodationPlace,
  comfort: ComfortLevel,
  fallbackDescription?: string,
  fallbackPhotos: string[] = []
): TourAccommodation {
  const normalized = normalizeAccommodationPlace(place);
  const isBookingOnly = normalized.displayMode === "booking_link";

  return {
    id: normalized.id,
    name: normalized.name || "Проживание",
    description: isBookingOnly
      ? normalized.description.trim() ||
        "Подробности размещения — на Booking.com. Бронирование номера оформляется отдельно."
      : normalized.description || fallbackDescription || "",
    comfort,
    accommodationType: normalized.accommodationType,
    amenities: normalized.amenities,
    images: normalized.images.length ? normalized.images : fallbackPhotos,
    nights: normalized.nights,
    fullPeriod: normalized.fullPeriod,
    displayMode: normalized.displayMode,
    bookingUrl: normalized.bookingUrl,
    bookingLabel: normalized.bookingLabel,
    roomTypes: isBookingOnly ? [] : normalized.roomTypes,
    alternatives: normalized.alternatives.map((alt) => ({
      ...alt,
      roomTypes: undefined,
    })),
  };
}

export function mapAccommodationPlacesToPublic(
  places: OrganizerTourAccommodationPlace[],
  comfort: ComfortLevel,
  fallbackDescription?: string,
  fallbackPhotos: string[] = []
): TourAccommodation[] {
  if (!places.length) return [];
  return places.map((place) =>
    mapAccommodationPlaceToPublic(place, comfort, fallbackDescription, fallbackPhotos)
  );
}

/** Найти тип номера «по умолчанию» — первый с нулевой доплатой или первый в списке. */
export function resolveDefaultIncludedRoomId(
  roomTypes: Array<{ id: string; priceUsdPerPerson: number }>
): string {
  const included = roomTypes.find((room) => room.priceUsdPerPerson === 0);
  return included?.id ?? roomTypes[0]?.id ?? "double";
}

export interface CheckoutRoomOption {
  id: string;
  title: string;
  description: string;
  priceUsdPerTraveler: number;
  capacity: number;
}

export function resolveCheckoutRoomOptionsFromAccommodations(
  accommodations: TourAccommodation[],
  upgradesEnabled = true
): CheckoutRoomOption[] {
  if (!upgradesEnabled) return [];

  const roomTypes = accommodations.flatMap((place) =>
    place.displayMode !== "booking_link" ? place.roomTypes ?? [] : []
  );

  if (!roomTypes.length) return [];

  return roomTypes.map((room) => ({
    id: room.id,
    title: room.name,
    description: room.description,
    priceUsdPerTraveler: room.priceUsdPerPerson,
    capacity: room.capacity,
  }));
}

export function legacyAccommodationToPlace(
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
    roomTypes: accommodation.roomTypes,
    alternatives: accommodation.alternatives?.map((alt) => ({
      id: alt.id,
      name: alt.name,
      accommodationType: alt.accommodationType,
      description: alt.description,
      images: alt.images,
      displayMode: alt.displayMode,
      bookingUrl: alt.bookingUrl,
      bookingLabel: alt.bookingLabel,
    })),
  });
}
