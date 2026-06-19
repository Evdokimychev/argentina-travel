import type { PodborRegionId, PodborRegionResult } from "@/types/podbor";

export interface PodborRegionMeta {
  id: PodborRegionId;
  name: string;
  slug: string;
  destinationSlug: string;
  image: string;
  description: string;
  bestSeason: string;
  idealDuration: string;
  /** Позиция маркера на SVG-карте (0–100). */
  mapX: number;
  mapY: number;
  tourKeywords: string[];
  excursionCitySlugs: string[];
}

export const PODBOR_REGIONS: Record<PodborRegionId, PodborRegionMeta> = {
  patagonia: {
    id: "patagonia",
    name: "Патагония",
    slug: "patagonia",
    destinationSlug: "patagonia",
    image:
      "https://images.unsplash.com/photo-1516026672322-bc52c61a55d5?w=1200&q=80",
    description: "Ледники, горные тропы и простор юга — для тех, кто ищет масштаб природы.",
    bestSeason: "октябрь — апрель",
    idealDuration: "7–12 дней",
    mapX: 42,
    mapY: 88,
    tourKeywords: ["patagonia", "glacier", "ледник", "calafate", "fitz"],
    excursionCitySlugs: ["el-calafate", "el-chalten"],
  },
  bariloche: {
    id: "bariloche",
    name: "Барилоче и озёра",
    slug: "bariloche",
    destinationSlug: "bariloche",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80",
    description: "Озёра, Анд и горные маршруты — мягкая Патагония с комфортной инфраструктурой.",
    bestSeason: "декабрь — март, июнь — сентябрь (лыжи)",
    idealDuration: "4–6 дней",
    mapX: 38,
    mapY: 78,
    tourKeywords: ["bariloche", "озёр", "озер"],
    excursionCitySlugs: ["bariloche"],
  },
  iguazu: {
    id: "iguazu",
    name: "Игуасу",
    slug: "iguazu",
    destinationSlug: "iguazu",
    image:
      "https://images.unsplash.com/photo-1558980664-1db756751b1a?w=1200&q=80",
    description: "280 водопадов в тропическом парке — один из главных символов континента.",
    bestSeason: "март — май, август — ноябрь",
    idealDuration: "3–4 дня",
    mapX: 72,
    mapY: 52,
    tourKeywords: ["iguazu", "iguazú", "водопад", "misiones"],
    excursionCitySlugs: ["puerto-iguazu"],
  },
  "buenos-aires": {
    id: "buenos-aires",
    name: "Буэнос-Айрес",
    slug: "ba",
    destinationSlug: "ba",
    image:
      "https://images.unsplash.com/photo-1589909202802-8d28781408ec?w=1200&q=80",
    description: "Танго, архитектура, гастрономия и ритм мегаполиса у Río de la Plata.",
    bestSeason: "круглый год, комфортнее март — май и сентябрь — ноябрь",
    idealDuration: "3–5 дней",
    mapX: 68,
    mapY: 62,
    tourKeywords: ["buenos-aires", "tango", "танго", "ba"],
    excursionCitySlugs: ["buenos-aires"],
  },
  salta: {
    id: "salta",
    name: "Сальта и северо-запад",
    slug: "salta",
    destinationSlug: "salta",
    image:
      "https://images.unsplash.com/photo-1516026672322-bc52c61a55d5?w=1200&q=80",
    description: "Каньоны, солончаки и винные долины — колоритный север с андской культурой.",
    bestSeason: "апрель — октябрь",
    idealDuration: "6–9 дней",
    mapX: 48,
    mapY: 28,
    tourKeywords: ["salta", "cafayate", "северо-запад", "northwest"],
    excursionCitySlugs: ["salta"],
  },
  ushuaia: {
    id: "ushuaia",
    name: "Огненная Земля",
    slug: "ushuaia",
    destinationSlug: "ushuaia",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
    description: "Край света: каналы Бигля, пингвины и антарктическая экспедиционная атмосфера.",
    bestSeason: "ноябрь — март",
    idealDuration: "4–6 дней",
    mapX: 52,
    mapY: 96,
    tourKeywords: ["ushuaia", "огненн", "пингвин", "tierra"],
    excursionCitySlugs: ["ushuaia"],
  },
  mendoza: {
    id: "mendoza",
    name: "Мендоса",
    slug: "mendoza",
    destinationSlug: "mendoza",
    image:
      "https://images.unsplash.com/photo-1506377247377-2ecb89819a88?w=1200&q=80",
    description: "Malbec, bodegas и вид на Аконкагуа — вино и горы в одном маршруте.",
    bestSeason: "март — май, сентябрь — ноябрь",
    idealDuration: "4–6 дней",
    mapX: 32,
    mapY: 48,
    tourKeywords: ["mendoza", "wine", "вино", "malbec"],
    excursionCitySlugs: ["mendoza"],
  },
};

export function toRegionResult(
  id: PodborRegionId,
  score: number
): PodborRegionResult {
  const meta = PODBOR_REGIONS[id];
  return {
    id,
    name: meta.name,
    slug: meta.slug,
    score,
    image: meta.image,
    description: meta.description,
    bestSeason: meta.bestSeason,
    idealDuration: meta.idealDuration,
    mapX: meta.mapX,
    mapY: meta.mapY,
  };
}
