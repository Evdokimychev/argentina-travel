import { getImmigrationPillarBySlug } from "@/data/immigration-pillars";
import { getImmigrationTopicHeroImage } from "@/lib/media-resolver";
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
    shortDescription: "Город, медицина, жильё и повседневные документы",
    heroImage: "",
  },
  "protsess-immigratsii": {
    id: "immigration-process",
    slug: "protsess-immigratsii",
    title: "Процесс иммиграции",
    shortDescription: "Въезд, RADEX, документы и precaria",
    heroImage: "",
  },
  "rody-v-argentine": {
    id: "birth",
    slug: "rody-v-argentine",
    title: "Роды в Аргентине",
    shortDescription: "Гражданство ребёнка и отдельный статус родителей",
    heroImage: "",
  },
  grazhdanstvo: {
    id: "citizenship",
    slug: "grazhdanstvo",
    title: "Гражданство",
    shortDescription: "Два года законного проживания без выездов и подача в DNM",
    heroImage: "",
  },
  "vnzh-i-pmzh": {
    id: "residency",
    slug: "vnzh-i-pmzh",
    title: "ВНЖ и ПМЖ",
    shortDescription: "15 подкатегорий temporaria, permanente, precaria и продление",
    heroImage: "",
  },
  vozmozhnosti: {
    id: "opportunities",
    slug: "vozmozhnosti",
    title: "Выбор категории",
    shortDescription: "Доход, работа, учёба, семья и гражданство MERCOSUR",
    heroImage: "",
  },
  "poleznye-ssylki": {
    id: "useful-links",
    slug: "poleznye-ssylki",
    title: "Официальные источники",
    shortDescription: "DNM, RADEX, законы и действующие процедуры",
    heroImage: "",
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
    IMMIGRATION_TOPIC_ORDER.map((slug) => [
      slug,
      withPillar({
        ...TOPIC_META[slug],
        heroImage: getImmigrationTopicHeroImage(slug),
      }),
    ])
  ) as Record<ImmigrationTopicSlug, ImmigrationTopicPage>;

export const IMMIGRATION_TOPIC_LIST = IMMIGRATION_TOPIC_ORDER.map(
  (slug) => IMMIGRATION_TOPICS[slug]
);
