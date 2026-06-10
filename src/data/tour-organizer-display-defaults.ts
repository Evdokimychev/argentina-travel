export const ORGANIZER_SHORT_DESCRIPTION_MAX = 180;
export const ORGANIZER_EXTENDED_DESCRIPTION_MAX = 1500;
export const TOUR_PARTICIPANT_RECOMMENDATIONS_MAX = 6;
export const TOUR_ROUTE_FEATURES_MAX = 1000;

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
