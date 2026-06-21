import type { TourEmbedConfig } from "@/types/tour-embed";

/** Дополнительные tour embeds для indexable-статей без inline-блока в blog.ts */
export const BLOG_TOUR_EMBEDS: Record<string, TourEmbedConfig[]> = {
  "best-time-to-visit-argentina": [
    {
      id: "season-tours-strip",
      variant: "strip",
      title: "Готовые маршруты по сезону",
      subtitle: "Туры с учётом климата и логистики региона",
      limit: 6,
      source: { kind: "query", query: "Patagonia" },
      catalogHref: "/podbor",
      catalogLabel: "Подбор маршрута",
      tone: "inline",
    },
  ],
  "argentinian-steak-guide": [
    {
      id: "ba-food-compact",
      variant: "compact-list",
      title: "Гастрономические экскурсии в Буэнос-Айресе",
      subtitle: "Asado, parrilla и дегустации с гидом",
      limit: 3,
      source: { kind: "query", query: "buenos" },
      catalogHref: "/tours?query=buenos",
      tone: "inline",
    },
  ],
  "tango-beginners-guide": [
    {
      id: "ba-tango-featured",
      variant: "featured",
      title: "Экскурсии с танго в Буэнос-Айресе",
      subtitle: "Milonga, шоу и исторические кварталы",
      limit: 3,
      source: { kind: "query", query: "tango" },
      catalogHref: "/tours?query=tango",
      catalogLabel: "Туры с танго",
      tone: "inline",
    },
  ],
  "natsionalnye-parki-argentiny": [
    {
      id: "national-parks-grid",
      variant: "grid",
      title: "Туры по национальным паркам",
      subtitle: "Игуасу, Патагония, Барилоче — с гидом и логистикой",
      limit: 3,
      source: { kind: "query", query: "national park" },
      catalogHref: "/places?collection=best-national-parks",
      catalogLabel: "Справочник парков",
      tone: "inline",
    },
  ],
  "patagonia-whale-watching": [
    {
      id: "valdes-whale-featured",
      variant: "featured",
      title: "Наблюдение за китами и морской природой",
      subtitle: "Полуостров Вальдес и Puerto Madryn",
      limit: 3,
      source: { kind: "query", query: "whale Valdes" },
      catalogHref: "/tours?query=whale",
      catalogLabel: "Туры с китами",
      tone: "inline",
    },
  ],
  "patagonia-penguins": [
    {
      id: "penguins-compact",
      variant: "compact-list",
      title: "Туры к пингвинам и морской дикой природе",
      subtitle: "Пунта-Томбо, Вальдес и Ушуайя",
      limit: 3,
      source: { kind: "query", query: "penguin" },
      catalogHref: "/tours?query=penguin",
      tone: "inline",
    },
  ],
  "iguazu-за-3-дня": [
    {
      id: "iguazu-3day-featured",
      variant: "featured",
      title: "Экскурсии к водопадам Игуасу",
      subtitle: "Глотка Дьявола, маршруты по парку — с гидом и трансфером",
      limit: 3,
      source: { kind: "query", query: "Iguazu" },
      catalogHref: "/tours?query=Iguazu",
      catalogLabel: "Туры в Игуасу",
      tone: "inline",
    },
  ],
  "iguazu-garganta-del-diablo": [
    {
      id: "iguazu-garganta-featured",
      variant: "featured",
      title: "Экскурсии к водопадам Игуасу",
      subtitle: "Garganta del Diablo и маршруты по парку — с гидом и трансфером",
      limit: 3,
      source: { kind: "query", query: "Iguazu" },
      catalogHref: "/tours?query=Iguazu",
      catalogLabel: "Туры в Игуасу",
      tone: "inline",
    },
  ],
  "wildlife-с-гидом": [
    {
      id: "wildlife-guide-featured",
      variant: "featured",
      title: "Экскурсии по дикой природе Аргентины",
      subtitle: "Киты, пингвины, Ибера и Патагония — с гидом и трансфером",
      limit: 3,
      source: { kind: "query", query: "wildlife Argentina" },
      catalogHref: "/tours?query=wildlife",
      catalogLabel: "Туры по природе",
      tone: "inline",
    },
  ],
  "buenos-aires-за-3-дня": [
    {
      id: "ba-3day-compact",
      variant: "compact-list",
      title: "Экскурсии по Буэнос-Айресу",
      subtitle: "Готовые маршруты на 2–3 дня с гидом",
      limit: 3,
      source: { kind: "query", query: "buenos" },
      catalogHref: "/tours?query=buenos",
      tone: "inline",
    },
  ],
};

export function getBlogTourEmbeds(slug: string): TourEmbedConfig[] | undefined {
  return BLOG_TOUR_EMBEDS[slug];
}
