export const TOUR_SECTION_COMMENT_IDS = [
  "description",
  "places",
  "itinerary",
  "dates",
  "included",
  "accommodations",
  "important",
  "logistics",
  "routeMap",
  "packing",
  "faq",
  "policies",
] as const;

export type TourSectionCommentId = (typeof TOUR_SECTION_COMMENT_IDS)[number];

export type TourSectionOrganizerComments = Partial<Record<TourSectionCommentId, string>>;

export const TOUR_SECTION_COMMENT_LABELS: Record<TourSectionCommentId, string> = {
  description: "Описание путешествия",
  places: "Главные впечатления",
  itinerary: "Программа по дням",
  dates: "Даты и цены",
  included: "Условия тура",
  accommodations: "Проживание",
  important: "Важно знать",
  logistics: "Логистика и перелёт",
  routeMap: "Маршрут и дорога",
  packing: "Что взять с собой",
  faq: "Вопросы и ответы",
  policies: "Условия и страхование",
};
