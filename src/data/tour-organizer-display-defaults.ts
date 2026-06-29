import { DEFAULT_ORGANIZER_OWNER_ID } from "@/types/user";

export const ORGANIZER_SHORT_DESCRIPTION_MAX = 180;
export const ORGANIZER_EXTENDED_DESCRIPTION_MAX = 1500;
export const TOUR_PARTICIPANT_RECOMMENDATIONS_MAX = 6;
export const TOUR_ROUTE_FEATURES_MAX = 1000;
export const TOUR_ITINERARY_ORGANIZER_COMMENT_MAX = 2000;
export const TOUR_ACCOMMODATION_ORGANIZER_COMMENT_MAX = 2000;

/** Единый организатор для seed-листингов нативных туров (реальный аккаунт площадки). */
export const NATIVE_SEED_ORGANIZER_OWNER_ID = DEFAULT_ORGANIZER_OWNER_ID;

export const NATIVE_SEED_ORGANIZER_LISTING = {
  name: "Иван Евдокимычев",
  avatar: "",
  slug: NATIVE_SEED_ORGANIZER_OWNER_ID,
} as const;

export const NATIVE_SEED_ORGANIZER_EXTRA = {
  name: "Иван Евдокимычев",
  role: "Организатор путешествий",
  avatar: "",
} as const;

export function normalizeParticipantRecommendations(items?: string[]): string[] {
  if (!items?.length) return [];
  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, TOUR_PARTICIPANT_RECOMMENDATIONS_MAX);
}

export function normalizeRouteFeaturesText(text?: string): string {
  return (text ?? "").trim().slice(0, TOUR_ROUTE_FEATURES_MAX);
}

export function normalizeItineraryOrganizerComment(text?: string): string {
  return (text ?? "").trim().slice(0, TOUR_ITINERARY_ORGANIZER_COMMENT_MAX);
}

export function normalizeAccommodationOrganizerComment(text?: string): string {
  return (text ?? "").trim().slice(0, TOUR_ACCOMMODATION_ORGANIZER_COMMENT_MAX);
}
