import type { AccommodationType, ComfortLevel } from "@/types";

/** Как показывать место проживания на сайте. */
export type AccommodationDisplayMode = "manual" | "booking_link";

export interface TourAccommodationRoomType {
  id: string;
  name: string;
  description: string;
  capacity: number;
  /** 0 — включено в стоимость тура. */
  priceUsdPerPerson: number;
  images: string[];
}

export interface TourAccommodationAlternative {
  id: string;
  name: string;
  accommodationType: AccommodationType;
  description: string;
  images: string[];
  displayMode: AccommodationDisplayMode;
  bookingUrl?: string;
  bookingLabel?: string;
}

export interface TourAccommodation {
  id: string;
  name: string;
  description: string;
  comfort: ComfortLevel;
  accommodationType?: AccommodationType;
  amenities: string[];
  images: string[];
  nights?: number;
  fullPeriod?: boolean;
  displayMode?: AccommodationDisplayMode;
  bookingUrl?: string;
  bookingLabel?: string;
  roomTypes?: TourAccommodationRoomType[];
  alternatives?: TourAccommodationAlternative[];
}
