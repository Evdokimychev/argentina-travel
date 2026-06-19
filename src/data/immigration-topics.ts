import { getImmigrationPillarBySlug } from "@/data/immigration-pillars";
import type { ImmigrationTopicPage } from "@/types/immigration-topic";

export const IMMIGRATION_TOPIC_ORDER = [
  "zhizn-v-strane",
  "protsess-immigratsii",
  "rody-v-argentine",
  "grazhdanstvo",
  "vnzh-i-pmzh",
  "vozmozhnosti",
  "poleznye-ssylki",
] as const;

export type ImmigrationTopicSlug = (typeof IMMIGRATION_TOPIC_ORDER)[number];

const TOPIC_META: Record<
  ImmigrationTopicSlug,
  Omit<ImmigrationTopicPage, "pillarPage">
> = {
  "zhizn-v-strane": {
    id: "life-in-country",
    slug: "zhizn-v-strane",
    title: "Жизнь в стране",
    shortDescription: "Климат, медицина, жильё, продукты и сообщество экспатов",
    heroImage:
      "https://images.unsplash.com/photo-1483728642387-6bc3bd38dafc?w=1920&q=80",
  },
  "protsess-immigratsii": {
    id: "immigration-process",
    slug: "protsess-immigratsii",
    title: "Процесс иммиграции",
    shortDescription: "Въезд, Decreto 366/2025, RADEX и документы для ВНЖ",
    heroImage:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80",
  },
  "rody-v-argentine": {
    id: "birth",
    slug: "rody-v-argentine",
    title: "Роды в Аргентине",
    shortDescription: "Jus soli, гражданство ребёнку и ВНЖ для родителей",
    heroImage:
      "https://images.unsplash.com/photo-1555252333-9f8e92e665df?w=1920&q=80",
  },
  grazhdanstvo: {
    id: "citizenship",
    slug: "grazhdanstvo",
    title: "Гражданство",
    shortDescription: "Административно (DNM), Decreto 366/2025 — 2 года без выезда",
    heroImage:
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1920&q=80",
  },
  "vnzh-i-pmzh": {
    id: "residency",
    slug: "vnzh-i-pmzh",
    title: "ВНЖ и ПМЖ",
    shortDescription: "15 оснований temporaria, ПМЖ, precaria и реформа 366/2025",
    heroImage:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80",
  },
  vozmozhnosti: {
    id: "opportunities",
    slug: "vozmozhnosti",
    title: "Возможности",
    shortDescription: "Рантье, кочевник, самостоятельно и с сопровождением специалиста",
    heroImage:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80",
  },
  "poleznye-ssylki": {
    id: "useful-links",
    slug: "poleznye-ssylki",
    title: "Полезные ссылки",
    shortDescription: "Migraciones, статьи и смежные разделы платформы",
    heroImage:
      "https://images.unsplash.com/photo-1454165804603-c3d57bc86b40?w=1920&q=80",
  },
};

function withPillar(meta: Omit<ImmigrationTopicPage, "pillarPage">): ImmigrationTopicPage {
  const pillar = getImmigrationPillarBySlug(meta.slug);
  if (!pillar) {
    throw new Error(`Missing immigration pillar for slug: ${meta.slug}`);
  }
  return { ...meta, pillarPage: pillar };
}

export const IMMIGRATION_TOPICS: Record<ImmigrationTopicSlug, ImmigrationTopicPage> =
  Object.fromEntries(
    IMMIGRATION_TOPIC_ORDER.map((slug) => [slug, withPillar(TOPIC_META[slug])])
  ) as Record<ImmigrationTopicSlug, ImmigrationTopicPage>;

export const IMMIGRATION_TOPIC_LIST = IMMIGRATION_TOPIC_ORDER.map(
  (slug) => IMMIGRATION_TOPICS[slug]
);
