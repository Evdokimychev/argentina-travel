export type SearchResultType =
  | "tour"
  | "excursion"
  | "place"
  | "blog"
  | "faq"
  | "page"
  | "legal"
  | "destination"
  | "guide"
  | "immigration"
  | "knowledge";

export type SearchIndexItem = {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string;
  href: string;
  keywords?: string[];
};

export const SEARCH_TYPE_LABELS: Record<SearchResultType, string> = {
  tour: "Туры",
  excursion: "Экскурсии",
  place: "Места",
  blog: "Блог",
  faq: "FAQ",
  page: "Страницы",
  legal: "Документы",
  destination: "Направления",
  guide: "Путеводитель",
  immigration: "Иммиграция",
  knowledge: "База знаний",
};
