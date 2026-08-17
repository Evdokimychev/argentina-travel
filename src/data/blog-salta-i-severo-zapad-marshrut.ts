/**
 * SSOT for /blog/salta-i-severo-zapad-marshrut (start-here pillar).
 * Body previously lived as legacyManualSectionOverrides + officialSources in blog.ts.
 */
import type { BlogPost, BlogPostSection } from "@/types";
import { formatBlogReadTime } from "@/lib/blog-utils";
import { BLOG_EDITORIAL } from "@/data/blog-author";

export const SALTA_I_SEVERO_ZAPAD_MARSHRUT_SLUG = "salta-i-severo-zapad-marshrut";

export const SALTA_I_SEVERO_ZAPAD_MARSHRUT_EXCERPT =
  "Готовый маршрут по северо-западу: Сальта, Пурмамарка, Salinas Grandes, Кафаяте и виноградники — логистика, сезоны и бюджет.";

export const SALTA_I_SEVERO_ZAPAD_MARSHRUT_SEO_DESCRIPTION =
  "Сальта и северо-запад Аргентины: маршрут на 5–7 дней — ветки маршрута, высота, дороги и проверка перед выездом.";

export const SALTA_I_SEVERO_ZAPAD_MARSHRUT_SOURCES_BODY =
  "Проверено 17.07.2026. Перед выездом проверяйте состояние дорог и предупреждения о высоте.\n\n* [Официальный туристический портал Аргентины — Сальта](https://www.argentina.gob.ar/jefatura/turismo/viaja-por-argentina/salta)\n* [Официальный туристический портал Аргентины — Качи](https://www.argentina.gob.ar/jefatura/turismo-y-ambiente/turismo/best-tourism-villages-argentina/cachi-salta)";

const READ_TIME_MINUTES = 12;

export const SALTA_I_SEVERO_ZAPAD_MARSHRUT_SECTIONS: BlogPostSection[] = [
  {
    title: "Кратко",
    body:
      "Северо-запад Аргентины объединяет Сальту, долины Кальчаки, Качи, Кафаяте и высокогорные направления. Не пытайтесь собрать всё в один плотный круг: выберите одну ветку маршрута, оставьте запас времени и перед выездом проверьте высоту, погоду и состояние дорог.",
  },
  {
    title: "Маршрут по дням",
    body:
      "Для первой поездки удобно оставить Сальту базой на один-два дня, затем выбрать либо северное направление через Кебраду-де-Умауака, либо южное — Качи, национальный парк Лос-Кардонес и Кафаяте. Некоторые дороги идут через горные участки, поэтому навигатор не заменяет официальную сводку состояния трассы.",
  },
  {
    title: "Практика",
    body:
      "Высокогорные точки требуют постепенной акклиматизации. Не планируйте тяжёлую нагрузку сразу после прилёта, берите воду и заранее сохраните офлайн-карту. Аренду автомобиля, экскурсию и допустимость маршрута выбирайте после проверки дорожных условий на даты поездки.",
  },
  {
    title: "Бюджет",
    body:
      "Считайте бюджет по отдельным актуальным предложениям: проживание, транспорт, топливо, экскурсии и питание. Фиксированные суммы в долларах и песо не используются, потому что быстро теряют актуальность.",
  },
  {
    title: "FAQ",
    body:
      "Когда ехать? Сезон выбирайте под конкретные высоты и маршрут. Нужен ли автомобиль повышенной проходимости? Это зависит от дороги и её состояния на дату поездки. С детьми и при хронических заболеваниях заранее обсудите высокогорный маршрут с подходящим специалистом.",
  },
  {
    title: "Источники и дата проверки",
    body: SALTA_I_SEVERO_ZAPAD_MARSHRUT_SOURCES_BODY,
  },
];

export const SALTA_I_SEVERO_ZAPAD_MARSHRUT_POST: Omit<BlogPost, "content" | "image"> & {
  content?: string;
  image?: string;
} = {
  id: "blog-salta-nw-route",
  slug: SALTA_I_SEVERO_ZAPAD_MARSHRUT_SLUG,
  title: "Сальта и северо-запад: маршрут на 5–7 дней",
  seoTitle: "Сальта и северо-запад Аргентины: маршрут 5–7 дней",
  seoDescription: SALTA_I_SEVERO_ZAPAD_MARSHRUT_SEO_DESCRIPTION,
  excerpt: SALTA_I_SEVERO_ZAPAD_MARSHRUT_EXCERPT,
  sections: SALTA_I_SEVERO_ZAPAD_MARSHRUT_SECTIONS,
  author: BLOG_EDITORIAL.name,
  authorBio: BLOG_EDITORIAL.bio,
  date: "2026-06-21",
  dateModified: "2026-07-17",
  category: "Север Аргентины",
  readTimeMinutes: READ_TIME_MINUTES,
  readTime: formatBlogReadTime(READ_TIME_MINUTES),
  tags: ["Сальта", "северо-запад", "Пурмамарка", "Кафаяте", "маршрут", "NOA"],
  featured: true,
  cardVariant: "featured",
  editorialReviewed: true,
  tourEmbeds: [
    {
      id: "salta-nw-featured",
      variant: "featured",
      title: "Туры в Сальту и на северо-запад",
      subtitle: "Quebrada, Salinas Grandes и винный Кафаяте — с гидом и трансфером",
      limit: 3,
      source: { kind: "query", query: "Salta northwest" },
      catalogHref: "/tours?query=Salta",
      catalogLabel: "Туры в Сальту",
      tone: "inline",
    },
  ],
  relatedResources: [
    { label: "Сальта", href: "/places/salta", type: "guide" },
    { label: "Los Cardones", href: "/blog/natsionalnyy-park-los-cardones", type: "guide" },
    { label: "Туристические регионы", href: "/guide/turistskie-regiony", type: "guide" },
    { label: "Подбор: цвета северо-запада", href: "/podbor/salta", type: "tour" },
  ],
};
