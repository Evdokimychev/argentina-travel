import type { BlogPost } from "@/types";

/** Тематические пулы — только существующие уникальные файлы в public/media */
export type BlogImageTopic =
  | "patagonia"
  | "buenos-aires"
  | "northwest"
  | "iguazu"
  | "parks"
  | "trekking"
  | "wine"
  | "wildlife"
  | "food"
  | "transport"
  | "money"
  | "internet"
  | "immigration"
  | "safety"
  | "travel"
  | "relocation";

/** Явные обложки для ключевых материалов (не перезаписывать эвристикой). */
export const BLOG_SLUG_HERO_OVERRIDES: Record<string, string> = {
  "best-time-to-visit-argentina": "/media/blog/best-time-to-visit-argentina/hero.jpg",
  "patagonia-packing-list": "/media/blog/patagonia-packing-list/hero.jpg",
  "blue-dollar-argentina-2026": "/media/blog/blue-dollar-argentina-2026/hero.jpg",
  "money-karty": "/media/blog/money-karty/hero.jpg",
  "argentinian-steak-guide": "/media/blog/argentinian-steak-guide/hero.jpg",
  "tango-beginners-guide": "/media/blog/tango-beginners-guide/hero.jpg",
  "natsionalnye-parki-argentiny": "/media/blog/natsionalnye-parki-argentiny/hero.jpg",
  "patagoniya-marshrut-14-dney": "/media/blog/patagoniya-marshrut-14-dney/hero.jpg",
  "salta-i-severo-zapad-marshrut": "/media/blog/salta-i-severo-zapad-marshrut/hero.jpg",
  "iguazu-za-3-dnya": "/media/blog/iguazu-za-3-dnya/hero.jpg",
  "el-chalten-i-fitts-roy": "/media/blog/el-chalten-i-fitts-roy/hero.jpg",
  "mendoza-vinnyj-gid": "/media/blog/mendoza-vinnyj-gid/hero.jpg",
};

const TOPIC_IMAGE_POOLS: Record<BlogImageTopic, readonly string[]> = {
  money: [
    "/media/blog/blue-dollar-argentina-2026/hero.jpg",
    "/media/blog/money-karty/hero.jpg",
    "/media/blog/money-karty/section-1.jpg",
    "/media/blog/bankovskij-schet-argentina/hero.jpg",
    "/media/blog/kak-menyat-dengi-argentina/hero.jpg",
    "/media/blog/byudzhet-poezdki-argentina/hero.jpg",
    "/media/blog/stoimost-zhizni-buenos-aires/hero.jpg",
  ],
  immigration: [
    "/media/blog/argentina-tourist-visa-2026/hero.jpg",
    "/media/services/cards/visa-support.jpg",
    "/media/blog/vnzh-argentina-rezidenciya/hero.jpg",
    "/media/blog/grazhdanstvo-argentiny/hero.jpg",
    "/media/blog/dni-cuil-argentina/hero.jpg",
    "/media/blog/bankovskij-schet-argentina/hero.jpg",
    "/media/blog/viza-cifrovogo-kochevnika-argentina/hero.jpg",
  ],
  internet: [
    "/media/blog/internet.jpg",
    "/media/services/esim/hero.jpg",
    "/media/services/cards/connectivity.jpg",
    "/media/guide/svyaz/hero.jpg",
    "/media/guide/svyaz/content.jpg",
  ],
  transport: [
    "/media/blog/kak-dobratsya-v-argentinu/hero.jpg",
    "/media/blog/patagonia-aviabilety/hero.jpg",
    "/media/blog/patagonia-avtobusy/hero.jpg",
    "/media/blog/vnutrennie-aviabilety-argentina/hero.jpg",
    "/media/blog/patagonia-arenda-avto/hero.jpg",
    "/media/services/flights/hero.jpg",
    "/media/services/transfers/hero.jpg",
    "/media/services/car-rental/hero.jpg",
  ],
  patagonia: [
    "/media/blog/patagonia-packing-list/hero.jpg",
    "/media/places/el-chalten/hero.jpg",
    "/media/places/perito-moreno-glacier/hero.jpg",
    "/media/places/el-calafate/hero.jpg",
    "/media/places/fitz-roy/hero.jpg",
    "/media/places/ushuaia/hero.jpg",
    "/media/places/los-glaciares-national-park/hero.jpg",
    "/media/blog/patagonia-whale-watching/hero.jpg",
    "/media/blog/patagonia-penguins/hero.jpg",
    "/media/places/el-chalten/gallery-1.jpg",
    "/media/places/el-chalten/gallery-2.jpg",
    "/media/places/el-calafate/gallery-1.jpg",
    "/media/places/bariloche/hero.jpg",
    "/media/places/bariloche/gallery-1.jpg",
    "/media/places/ushuaia/gallery-1.jpg",
    "/media/blog/patagonia-arenda-avto/hero.jpg",
    "/media/blog/patagonia-avtobusy/hero.jpg",
    "/media/blog/patagonia-oteli/hero.jpg",
    "/media/blog/patagonia-aviabilety/hero.jpg",
    "/media/blog/wildlife-s-gidom/hero.jpg",
  ],
  "buenos-aires": [
    "/media/blog/buenos-aires-rajony/hero.jpg",
    "/media/places/buenos-aires/hero.jpg",
    "/media/blog/tango-beginners-guide/hero.jpg",
    "/media/places/buenos-aires/gallery-1.jpg",
    "/media/places/buenos-aires/gallery-2.jpg",
  ],
  northwest: [
    "/media/blog/salta-i-severo-zapad-marshrut/hero.jpg",
    "/media/places/salta/hero.jpg",
    "/media/places/purmamarca/hero.jpg",
    "/media/places/cerro-de-los-7-colores/hero.jpg",
    "/media/blog/northwest-za-5-dney/hero.jpg",
    "/media/blog/ruta-40-sem-ozer/hero.jpg",
  ],
  iguazu: [
    "/media/blog/iguazu-za-3-dnya/hero.jpg",
    "/media/blog/iguazu-garganta-del-diablo/hero.jpg",
    "/media/places/iguazu-falls/hero.jpg",
    "/media/blog/natsionalnyy-park-iguasu/hero.jpg",
  ],
  parks: [
    "/media/blog/natsionalnye-parki-argentiny/hero.jpg",
    "/media/places/los-glaciares-national-park/hero.jpg",
    "/media/places/nahuel-huapi-national-park/hero.jpg",
    "/media/blog/natsionalnyy-park-los-glasiares/hero.jpg",
    "/media/blog/natsionalnyy-park-lanin/hero.jpg",
    "/media/blog/natsionalnyy-park-talampaya/hero.jpg",
    "/media/blog/banado-la-estrella/hero.jpg",
  ],
  trekking: [
    "/media/blog/el-chalten-i-fitts-roy/hero.jpg",
    "/media/places/fitz-roy/hero.jpg",
    "/media/places/el-chalten/hero.jpg",
    "/media/blog/patagonia-mini-trekking/hero.jpg",
    "/media/places/el-chalten/gallery-2.jpg",
  ],
  wine: [
    "/media/blog/mendoza-vinnyj-gid/hero.jpg",
    "/media/blog/uco-valley-vino-i-gory/hero.jpg",
    "/media/blog/mendoza-wine-route/hero.jpg",
    "/media/places/mendoza/hero.jpg",
  ],
  wildlife: [
    "/media/blog/patagonia-whale-watching/hero.jpg",
    "/media/blog/patagonia-penguins/hero.jpg",
    "/media/blog/wildlife-s-gidom/hero.jpg",
    "/media/places/valdes-peninsula/hero.jpg",
    "/media/blog/natsionalnyy-park-poluostrov-valdes/hero.jpg",
  ],
  food: [
    "/media/blog/argentinian-steak-guide/hero.jpg",
    "/media/places/buenos-aires/gallery-3.jpg",
    "/media/places/mendoza/gallery-1.jpg",
  ],
  safety: [
    "/media/places/buenos-aires/gallery-4.jpg",
    "/media/services/insurance/hero.jpg",
    "/media/guide/bezopasnost/hero.jpg",
  ],
  travel: [
    "/media/blog/best-time-to-visit-argentina/hero.jpg",
    "/media/blog/itinerary-za-10-dney/hero.jpg",
    "/media/blog/itinerary-za-14-dney/hero.jpg",
    "/media/blog/argentina-10-dnej-3-nedeli/hero.jpg",
    "/media/blog/argentina-2-nedeli-marshrut/hero.jpg",
    "/media/places/iguazu-falls/hero.jpg",
  ],
  relocation: [
    "/media/blog/vnzh-argentina-rezidenciya/hero.jpg",
    "/media/blog/stoimost-zhizni-buenos-aires/hero.jpg",
    "/media/services/cards/visa-support.jpg",
    "/media/places/buenos-aires/hero.jpg",
  ],
};

const CATEGORY_TOPIC_MAP: Record<string, BlogImageTopic> = {
  Патагония: "patagonia",
  "Буэнос-Айрес": "buenos-aires",
  "Север Аргентины": "northwest",
  "Водопады Игуасу": "iguazu",
  "Национальные парки": "parks",
  "Горы и треккинг": "trekking",
  Винодельни: "wine",
  "Животные Аргентины": "wildlife",
  "Кухня Аргентины": "food",
  Транспорт: "transport",
  "Деньги и обмен валют": "money",
  "Интернет и связь": "internet",
  Безопасность: "safety",
  "Районы Буэнос-Айреса": "buenos-aires",
  "Переезд и релокация": "relocation",
  Иммиграция: "immigration",
  Путеводитель: "travel",
  Путешествия: "travel",
  Планирование: "travel",
  Практика: "travel",
  Маршруты: "travel",
};

const SLUG_TOPIC_RULES: Array<{ pattern: RegExp; topic: BlogImageTopic }> = [
  { pattern: /^money-|^blue-dollar|dengi|byudzhet|stoimost|bankovsk|kurs-|peso|dollar|nalichn|karty|obmen/, topic: "money" },
  { pattern: /viza|vnzh|immigr|grazhdan|rezidenc|cuil|radex|pasport|cifrovogo-kochevnika/, topic: "immigration" },
  { pattern: /esim|internet|svyaz|sim-|wifi|connect/, topic: "internet" },
  { pattern: /transport|avia|avtobus|avto|dobratsya|aeroport|vokzal|arenda-avto|flights/, topic: "transport" },
  { pattern: /^patagonia|patagoniya|perito|calafate|ushuaia|chalten|fitz|glaciar|lednik/, topic: "patagonia" },
  { pattern: /^buenos-aires|ba-|tango|recoleta|palermo|san-telmo/, topic: "buenos-aires" },
  { pattern: /northwest|salta|jujuy|purmamarca|humahuaca|severo-zapad|ruta-40/, topic: "northwest" },
  { pattern: /iguazu|iguasu|garganta/, topic: "iguazu" },
  { pattern: /natsional|national-park|park-|talampaya|valdes|ibera|lanin|los-alerses|los-cardones|tierra-del-fuego/, topic: "parks" },
  { pattern: /trek|trekking|hiking|trail|fitz-roy|chalten/, topic: "trekking" },
  { pattern: /wine|vino|mendoza|malbec|uco-valley|vinnyj/, topic: "wine" },
  { pattern: /wildlife|whale|penguin|pinguin|animal|valdes/, topic: "wildlife" },
  { pattern: /food|steak|asado|gastron|kukh|empanada|mate/, topic: "food" },
  { pattern: /itinerary|marshrut|za-\d|10-dnej|14-dney|chek-list|plan/, topic: "travel" },
  { pattern: /bezopas|safety|strahov/, topic: "safety" },
  { pattern: /reloc|pereezd|expat|zhizn-v-/, topic: "relocation" },
];

function hashSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const EN_CATEGORY_TOPIC_MAP: Record<string, BlogImageTopic> = {
  money: "money",
  internet: "internet",
  transport: "transport",
  safety: "safety",
  food: "food",
  patagonia: "patagonia",
  "buenos-aires": "buenos-aires",
  north: "northwest",
  iguazu: "iguazu",
  "national-parks": "parks",
  trekking: "trekking",
  wineries: "wine",
  wildlife: "wildlife",
  travel: "travel",
  relocation: "relocation",
  "ba-neighborhoods": "buenos-aires",
};

export function inferBlogImageTopic(post: Pick<BlogPost, "slug" | "category" | "tags">): BlogImageTopic {
  const slug = post.slug.toLowerCase();

  for (const rule of SLUG_TOPIC_RULES) {
    if (rule.pattern.test(slug)) return rule.topic;
  }

  for (const tag of post.tags) {
    const tagLower = tag.toLowerCase();
    for (const rule of SLUG_TOPIC_RULES) {
      if (rule.pattern.test(tagLower)) return rule.topic;
    }
  }

  return (
    CATEGORY_TOPIC_MAP[post.category] ??
    EN_CATEGORY_TOPIC_MAP[post.category] ??
    "travel"
  );
}

/** Детерминированный выбор обложки: slug + topic → разные индексы в пуле. */
export function pickBlogTopicImage(slug: string, topic: BlogImageTopic): string {
  const pool = TOPIC_IMAGE_POOLS[topic] ?? TOPIC_IMAGE_POOLS.travel;
  if (pool.length === 0) return TOPIC_IMAGE_POOLS.travel[0];
  const index = (hashSlug(slug) + hashSlug(`${topic}:${slug}`)) % pool.length;
  return pool[index];
}

export function resolveBlogSemanticHeroImage(
  post: Pick<BlogPost, "slug" | "category" | "tags">,
): string {
  const override = BLOG_SLUG_HERO_OVERRIDES[post.slug];
  if (override) return override;

  const topic = inferBlogImageTopic(post);
  return pickBlogTopicImage(post.slug, topic);
}

export function getBlogTopicImagePool(topic: BlogImageTopic): readonly string[] {
  return TOPIC_IMAGE_POOLS[topic] ?? TOPIC_IMAGE_POOLS.travel;
}
