const NATIVE_TOUR_SEO_TITLES: Record<string, string> = {
  "patagonia-glaciers": "Ледники Патагонии: Перито-Морено",
  "buenos-aires-tango": "Танго и гастрономия Буэнос-Айреса",
  "mendoza-wine": "Винный тур по Мендосе у подножия Анд",
  "iguazu-falls": "Тур к водопадам Игуасу",
  "salta-northwest": "Сальта и Кафаяте: тур по северу",
  "ushuaia-end-of-world": "Ушуайя: край света и пингвины",
};

type TourSeoInput = {
  slug: string;
  title: string;
  shortDescription: string;
  durationDays: number;
};

export function buildTourSeoTitle(tour: Pick<TourSeoInput, "slug" | "title">): string {
  return NATIVE_TOUR_SEO_TITLES[tour.slug] ?? tour.title;
}

export function buildTourSeoDescription(
  tour: Pick<TourSeoInput, "shortDescription" | "durationDays">,
): string {
  const summary = tour.shortDescription.trim().replace(/[.!?]+$/, "");
  return `${summary}. Маршрут на ${tour.durationDays} дней: программа, проживание, даты заездов и условия бронирования.`;
}
