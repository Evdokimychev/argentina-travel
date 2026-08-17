/**
 * SSOT for /blog/patagonia-авиабилеты.
 * Body previously lived as legacyManualReplacementSections + officialSources in blog.ts.
 */
import type { BlogPost, BlogPostSection } from "@/types";
import { formatBlogReadTime } from "@/lib/blog-utils";
import { BLOG_EDITORIAL } from "@/data/blog-author";

export const PATAGONIA_AVIABILETY_SLUG = "patagonia-авиабилеты";

export const PATAGONIA_AVIABILETY_EXCERPT =
  "Как выбрать аэропорт и внутренний перелёт по Патагонии, не полагаясь на устаревшее расписание.";

export const PATAGONIA_AVIABILETY_SEO_DESCRIPTION =
  "Внутренние рейсы в Патагонию: выбор аэропорта, проверка тарифа и багажа перед оплатой.";

export const PATAGONIA_AVIABILETY_SOURCES_BODY =
  "Проверено 17.07.2026. Сеть маршрутов, аэропорт вылета, правила багажа и тариф подтверждайте перед оплатой.\n\n* [Aeropuertos Argentina — аэропорты и текущие рейсы](https://www.aeropuertosargentina.com.ar/es)\n* [Aerolíneas Argentinas — действующая сеть внутренних направлений](https://www.aerolineas.com.ar/destinos/argentina)\n* [Intercargo — аэропорты Аргентины](https://www.argentina.gob.ar/intercargo/aeropuertos)";

const READ_TIME_MINUTES = 9;

export const PATAGONIA_AVIABILETY_SECTIONS: BlogPostSection[] = [
  {
    title: "Сначала выберите точку входа",
    body:
      "У Патагонии нет одного главного аэропорта. Для Озёрного края обычно смотрят Барилоче, для ледников — Эль-Калафате, для Огненной Земли — Ушуаю, для атлантического побережья — Трелью или Пуэрто-Мадрин. Начинайте не с перевозчика, а с маршрута по земле после прилёта.",
  },
  {
    title: "Как искать рейс",
    body:
      "Проверьте варианты на официальных сайтах действующих перевозчиков, затем сравните полную стоимость с багажом и выбором места. Отдельно посмотрите код аэропорта: рейсы Буэнос-Айреса могут использовать AEP или EZE. Если пересадка требует смены аэропорта, закладывайте самостоятельный переезд и большой запас времени.",
  },
  {
    title: "Перед оплатой",
    body:
      "Сверьте дату, аэропорт, нормы ручной клади, условия изменения и возврата. Не стройте плотную стыковку на двух отдельных билетах. После покупки сохраните подтверждение офлайн и ещё раз проверьте статус рейса накануне вылета.",
  },
  {
    title: "Источники и дата проверки",
    body: PATAGONIA_AVIABILETY_SOURCES_BODY,
  },
];

export const PATAGONIA_AVIABILETY_POST: Omit<BlogPost, "content" | "image"> & {
  content?: string;
  image?: string;
} = {
  id: "blog-patagonia-flights",
  slug: PATAGONIA_AVIABILETY_SLUG,
  title: "Патагония: как долететь и купить внутренние рейсы",
  seoTitle: "Патагония: как долететь и купить внутренние рейсы",
  seoDescription: PATAGONIA_AVIABILETY_SEO_DESCRIPTION,
  excerpt: PATAGONIA_AVIABILETY_EXCERPT,
  sections: PATAGONIA_AVIABILETY_SECTIONS,
  author: BLOG_EDITORIAL.name,
  authorBio: BLOG_EDITORIAL.bio,
  date: "2025-08-27",
  dateModified: "2026-07-17",
  category: "Патагония",
  readTimeMinutes: READ_TIME_MINUTES,
  readTime: formatBlogReadTime(READ_TIME_MINUTES),
  tags: ["ПАТАГОНИЯ", "АВИАБИЛЕТЫ ПО АРГЕНТИНЕ", "ЭЛЬ-КАЛАФАТЕ"],
  editorialReviewed: true,
  relatedResources: [
    { label: "Междугородние автобусы", href: "/blog/patagonia-автобусы", type: "blog" },
    { label: "Аренда автомобиля", href: "/blog/patagonia-аренда-авто", type: "blog" },
    { label: "Отели и бронирование", href: "/blog/patagonia-отели", type: "blog" },
    { label: "Сборы в Патагонию", href: "/blog/patagonia-packing-list", type: "blog" },
    { label: "Аргентина за 10 дней", href: "/blog/itinerary-за-10-дней", type: "blog" },
    { label: "Аргентина за 14 дней", href: "/blog/itinerary-за-14-дней", type: "blog" },
    { label: "Сравнить авиабилеты", href: "/flights?origin=MOW&destination=FTE", type: "guide" },
    { label: "10 типичных ошибок", href: "/blog/itinerary-ошибки", type: "blog" },
  ],
};
