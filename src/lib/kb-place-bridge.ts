/**
 * Мост «База знаний → Места».
 *
 * База знаний (content/knowledge-base, читается через content.ts) — ЕДИНЫЙ ИСТОЧНИК
 * текста, существования и связей для мест/регионов/карты. Место (`places-seed`)
 * остаётся кураторским СЛОЕМ: фото, enrichment, рейтинг, коллекции, популярность.
 *
 * Здесь текстовые поля карточки места накладываются («overlay») значениями из базы
 * знаний по выверенной карте `PLACE_TO_KB_ID`. Правка статьи в базе знаний → регенерация
 * `_index/content.json` (шаг сборки) → изменения автоматически видны в «Местах»,
 * «Регионах» и на «Карте» без ручного дублирования.
 *
 * Модуль серверный (тянет content.ts → fs); подключается только динамическим import()
 * из серверных функций репозитория, чтобы не попадать в клиентский бандл.
 */
import { getEntry } from "@/lib/knowledge-base/content";
import { normalizeMarkdownSections } from "@/lib/knowledge-base/markdown";
import type { KbEntry } from "@/lib/knowledge-base/types";
import { PLACE_TO_KB_ID } from "@/data/kb-place-id-map";
import { DESTINATION_TO_PLACE } from "@/data/knowledge-graph/entities";
import type { DestinationPage } from "@/data/destination-pages";
import type { PlaceDetail, PlaceListing } from "@/types/place";
import { isEditoriallyCleanRussianText } from "@/lib/editorial-text";

/** id региона базы знаний → отображаемый ярлык региона на сайте (как в places-seed). */
const KB_REGION_LABEL: Record<string, string> = {
  noa: "Северо-запад",
  patagonia: "Патагония",
  cuyo: "Куйо",
  litoral: "Северо-восток",
  pampa: "Центр и Пампа",
  "buenos-aires-province": "Центр и Пампа",
  caba: "Центр и Пампа",
  "tierra-del-fuego": "Огненная Земля",
};

/** Запись базы знаний, соответствующая месту по выверенной id-карте. */
export function kbEntryForPlaceSlug(slug: string): KbEntry | undefined {
  const id = PLACE_TO_KB_ID[slug];
  return id ? getEntry(id) : undefined;
}

/** Достаёт из тела статьи раздел «Описание» как связный текст (для fullDescription). */
export function extractKbLeadDescription(entry: KbEntry): string | undefined {
  const body = normalizeMarkdownSections(entry.body ?? "");
  const match = body.match(/(?:^|\n)##\s+Описание\s*\n+([\s\S]*?)(?=\n##\s|$)/);
  let text = match?.[1] ?? entry.summary ?? "";
  text = text
    .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, "$1") // [[id|Текст]] → Текст
    .replace(/\[\[([^\]]+)\]\]/g, "$1") // [[id]] → id (в прозе таких не осталось)
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **жирный** → жирный
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [Текст](url) → Текст
    .replace(/^[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return text || undefined;
}

/** Наложить текст базы знаний на карточку места (KB — источник истины). */
export function applyKbToListing(place: PlaceListing): PlaceListing {
  const kb = kbEntryForPlaceSlug(place.slug);
  if (!kb) return place;
  const region = kb.region_id ? KB_REGION_LABEL[kb.region_id] : undefined;
  return {
    ...place,
    name: kb.title || place.name,
    shortDescription: kb.summary || place.shortDescription,
    region: region || place.region,
    province: kb.province ?? place.province,
    latitude: kb.coordinates?.lat ?? place.latitude,
    longitude: kb.coordinates?.lng ?? place.longitude,
    tags: kb.tags && kb.tags.length > 0 ? kb.tags : place.tags,
    season:
      kb.best_time && kb.best_time.length > 0 ? kb.best_time.join("; ") : place.season,
    kbSlug: kb.id,
  };
}

/** Наложить текст базы знаний на детальную страницу места (включая связанные). */
export function applyKbToDetail(place: PlaceDetail): PlaceDetail {
  const kb = kbEntryForPlaceSlug(place.slug);
  if (!kb) {
    return { ...place, relatedPlaces: place.relatedPlaces.map(applyKbToListing) };
  }
  const listing = applyKbToListing(place);
  return {
    ...place,
    ...listing,
    fullDescription: extractKbLeadDescription(kb) || place.fullDescription,
    howToGetThere: kb.how_to_get_there ?? place.howToGetThere,
    relatedPlaces: place.relatedPlaces.map(applyKbToListing),
    kbSlug: kb.id,
  };
}


/** destination-хаб → id базы знаний (через destination→place→KB, плюс регион-хабы). */
const DESTINATION_KB_OVERRIDE: Record<string, string> = {
  patagonia: "patagonia", // регион-хаб без отдельного «места»
};
function kbIdForDestination(destId: string): string | undefined {
  if (DESTINATION_KB_OVERRIDE[destId]) return DESTINATION_KB_OVERRIDE[destId];
  const placeSlug = DESTINATION_TO_PLACE[destId];
  return placeSlug ? PLACE_TO_KB_ID[placeSlug] : undefined;
}

/**
 * Наложить текст базы знаний на карточку направления («Регионы»/destinations).
 * KB — источник описания/сезона/логистики; кураторскими остаются highlights,
 * travelTips, регион-группа, изображения (аналог фото/enrichment для мест).
 */
export function applyKbToDestination(dest: DestinationPage): DestinationPage {
  const id = kbIdForDestination(dest.id);
  const kb = id ? getEntry(id) : undefined;
  if (!kb) return dest;
  const lead = extractKbLeadDescription(kb);
  return {
    ...dest,
    name: kb.title || dest.name,
    description: kb.summary || dest.description,
    intro: lead || dest.intro,
    bestSeason:
      kb.best_time && kb.best_time.length > 0 ? kb.best_time.join("; ") : dest.bestSeason,
    idealDuration: kb.duration || dest.idealDuration,
    howToGetThere: kb.how_to_get_there || dest.howToGetThere,
    highlights: dest.highlights.filter(isEditoriallyCleanRussianText),
    travelTips: dest.travelTips.filter(isEditoriallyCleanRussianText),
  };
}
