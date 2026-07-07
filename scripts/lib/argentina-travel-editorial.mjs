/**
 * Редакторская обработка импортированных статей Argentina.travel:
 * выявление испанского, перевод тегов, расширение коротких материалов, проверка качества.
 */
import {
  buildRussianBody,
  translateActivity,
  translateToRu,
  translateFromCache,
  applyGlossaryExport as applyGlossary,
} from "./argentina-travel-translate.mjs";

const SPANISH_MARKERS =
  /\b(el|la|los|las|de|del|en|con|por|para|que|una|uno|este|esta|disfruta|explora|descubre|visita|camino|pueblo|parque|naturaleza|región|ciudad|provincia|tradición|historia|experiencia|invita|contemplar|recorrer|aldea|gastronomía|artesanías|empanadillas|secreto|origen|sedimentario|rocas|terminar|espera|deja|enamorar|encanto|corazón|deje|disfrute)\b/i;

const TAG_MAP = {
  "región norte": "северо-запад",
  "región sur": "юг",
  "región centro": "центр",
  naturaleza: "природа",
  jujuy: "жужуй",
  mendoza: "мендоса",
  salta: "сальта",
  patagonia: "патагония",
  city: "город",
  ciudad: "город",
  trekking: "треккинг",
  aventura: "приключения",
  cultura: "культура",
  gastronomía: "гастрономия",
  vinos: "вино",
  playa: "пляж",
  montaña: "горы",
  lagos: "озёра",
  glaciares: "ледники",
  fauna: "фауна",
  aves: "птицы",
  termas: "термальные источники",
  historia: "история",
  arquitectura: "архитектура",
};

const REGION_LABEL = {
  noa: "Северо-Запад",
  patagonia: "Патагония",
  cuyo: "Куйо",
  litoral: "Северо-Восток",
  pampa: "Центр и Пампа",
  "buenos-aires-province": "Центр и Пампа",
  caba: "Центр и Пампа",
  "tierra-del-fuego": "Огненная Земля",
};

export function hasCyrillic(text) {
  return /[а-яёА-ЯЁ]/.test(text ?? "");
}

export function spanishRatio(text) {
  if (!text?.trim()) return 0;
  const words = text.match(/\b[\p{L}]{3,}\b/gu) ?? [];
  if (!words.length) return 0;
  const spanish = words.filter((w) => SPANISH_MARKERS.test(w)).length;
  return spanish / words.length;
}

export function translateTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [
    ...new Set(
      tags
        .map((t) => {
          const key = String(t).toLowerCase().trim();
          return TAG_MAP[key] ?? (hasCyrillic(t) ? t : null);
        })
        .filter(Boolean)
    ),
  ];
}

export function cleanupBody(body) {
  return (
    body
      ?.replace(/^\$\d+\s*$/gm, "")
      .replace(/\bКуйо secreto\b/gi, "геологический секрет")
      .replace(/\s{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim() ?? ""
  );
}

export function isVaSourced(fm) {
  const sources = fm.sources;
  if (Array.isArray(sources)) {
    return sources.some(
      (s) =>
        (typeof s === "object" && s?.url?.includes("argentina.travel")) ||
        (typeof s === "string" && s.includes("argentina.travel"))
    );
  }
  return Boolean(fm.title_es || fm.media?.hero?.license === "argentina.travel");
}

export function parseCoordinates(fm) {
  const c = fm.coordinates;
  if (c && typeof c === "object" && c.lat != null && c.lng != null) {
    return { lat: Number(c.lat), lng: Number(c.lng) };
  }
  if (typeof c === "string" && c.includes("[object Object]")) return null;
  const lat = fm.coordinatesLat ?? fm.coordinates_lat;
  const lng = fm.coordinatesLng ?? fm.coordinates_lng;
  if (lat != null && lng != null) return { lat: Number(lat), lng: Number(lng) };
  return null;
}

export function qualityScore(fm, body) {
  let score = 0;
  if (hasCyrillic(fm.title)) score += 25;
  if (hasCyrillic(fm.summary) && spanishRatio(fm.summary) < 0.2) score += 20;
  const desc = body.match(/##\s+Описание\s*\n+([\s\S]*?)(?=\n##\s|$)/)?.[1] ?? body;
  if (desc.length > 180 && hasCyrillic(desc) && spanishRatio(desc) < 0.15) score += 35;
  if (parseCoordinates(fm)) score += 10;
  if (fm.media?.hero?.url) score += 10;
  return score;
}

export function isReadyForPublish(fm, body) {
  if (fm.site_ready === true && fm.status === "published") return true;
  return qualityScore(fm, body) >= 75;
}

function extractDescription(body) {
  const cleaned = cleanupBody(body);
  return cleaned.match(/##\s+Описание\s*\n+([\s\S]*?)(?=\n##\s|$)/)?.[1]?.trim() ?? "";
}

export function resolveRussianTitle(fm, translation) {
  if (translation?.title && hasCyrillic(translation.title)) return translation.title;
  if (hasCyrillic(fm.title)) return fm.title;

  for (const src of [fm.title_en, fm.title_es]) {
    if (!src) continue;
    const cached = translateFromCache(src, "en|ru") ?? translateFromCache(src, "es|ru");
    if (cached && hasCyrillic(cached)) return cached;
  }

  if (fm.title_en) {
    let t = applyGlossary(fm.title_en)
      .replace(/^The /i, "")
      .replace(/^City of /i, "Город ")
      .replace(/ Provincial Park$/i, " — провинциальный парк")
      .replace(/ National Park$/i, " — национальный парк")
      .replace(/ Delta$/i, " — дельта")
      .trim();
    if (t.length > 3) return t;
  }

  return fm.title;
}

/** Перевод испанского текста из уже сохранённого markdown (без повторного fetch). */
export async function translateExistingBody(body, { cacheOnly = false } = {}) {
  const desc = extractDescription(body);
  if (!desc || spanishRatio(desc) < 0.08) return [];

  const paragraphs = desc
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20 && spanishRatio(p) > 0.08);

  const translated = [];
  for (const p of paragraphs.slice(0, 5)) {
    const cached = translateFromCache(p, "es|ru");
    if (cached) {
      translated.push(cached);
      continue;
    }
    const ru = await translateToRu(p, { preferLang: "es", cacheOnly });
    if (ru && hasCyrillic(ru)) translated.push(ru);
  }
  return translated.filter(Boolean);
}

export function buildEditorialBody(fm, translation) {
  const lines = ["## Описание", ""];

  if (translation?.bodyParagraphs?.length) {
    lines.push(translation.bodyParagraphs.join("\n\n"));
  } else if (translation?.summary) {
    lines.push(translation.summary);
  } else {
    lines.push(fm.summary ?? "");
  }

  const descText = translation?.bodyParagraphs?.join(" ") ?? translation?.summary ?? "";
  const regionLabel = REGION_LABEL[fm.region_id] ?? fm.province;
  if (regionLabel && descText.length < 220) {
    lines.push(
      "",
      `${fm.title} — одна из достопримечательностей региона ${regionLabel}${fm.province ? ` (${fm.province})` : ""}. Материал подготовлен на основе официального портала INPROTUR (Argentina.travel) и адаптирован для путеводителя «Пора в Аргентину».`
    );
  }

  const factEntries = Object.entries(translation?.facts ?? {});
  if (factEntries.length) {
    lines.push("", "## Практическая информация", "");
    for (const [label, value] of factEntries) {
      lines.push(`- **${label}:** ${value}`);
    }
  } else if (parseCoordinates(fm)) {
    const { lat, lng } = parseCoordinates(fm);
    lines.push("", "## Практическая информация", "", `- **Координаты:** ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    if (fm.province) lines.push(`- **Провинция:** ${fm.province}`);
  } else if (fm.province) {
    lines.push("", "## Практическая информация", "", `- **Провинция:** ${fm.province}`);
  }

  const sourceUrl =
    fm.sources?.[0]?.url ?? `https://www.argentina.travel/es/actividades/${fm.id}`;
  lines.push(
    "",
    "## Источники",
    "",
    `- Официальный портал INPROTUR — [Visit Argentina](${sourceUrl}) (исп.; адаптировано ${new Date().toISOString().slice(0, 10)}).`
  );

  if (fm.media?.hero) {
    lines.push(
      "",
      "> Фотографии взяты с официального туристического портала Argentina.travel (INPROTUR). На сайте указывается источник и автор."
    );
  }

  return lines.join("\n");
}

export function expandThinBody(fm, body, translation) {
  const desc = extractDescription(body);
  let descText = desc;

  if (translation?.bodyParagraphs?.length) {
    return buildEditorialBody(fm, translation);
  }

  if ((descText.length < 120 || spanishRatio(descText) > 0.12) && translation?.summary) {
    descText = translation.summary;
  }

  const lines = ["## Описание", "", descText || translation?.summary || fm.summary || ""];

  const regionLabel = REGION_LABEL[fm.region_id] ?? fm.province;
  if (regionLabel && desc.length < 200) {
    lines.push(
      "",
      `${fm.title} — одна из достопримечательностей региона ${regionLabel}${fm.province ? ` (${fm.province})` : ""}. Материал подготовлен на основе официального портала INPROTUR (Argentina.travel) и адаптирован для путеводителя «Пора в Аргентину».`
    );
  }

  const factEntries = Object.entries(translation?.facts ?? {});
  if (factEntries.length) {
    lines.push("", "## Практическая информация", "");
    for (const [label, value] of factEntries) {
      lines.push(`- **${label}:** ${value}`);
    }
  } else if (parseCoordinates(fm)) {
    const { lat, lng } = parseCoordinates(fm);
    lines.push("", "## Практическая информация", "", `- **Координаты:** ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  }

  if (fm.province) {
    lines.push(`- **Провинция:** ${fm.province}`);
  }

  lines.push(
    "",
    "## Источники",
    "",
    `- Официальный портал INPROTUR — [Visit Argentina](${fm.sources?.[0]?.url ?? `https://www.argentina.travel/es/actividades/${fm.id}`}) (исп.; адаптировано ${new Date().toISOString().slice(0, 10)}).`
  );

  if (fm.media?.hero) {
    lines.push(
      "",
      "> Фотографии взяты с официального туристического портала Argentina.travel (INPROTUR). На сайте указывается источник и автор."
    );
  }

  return lines.join("\n");
}

export async function editorialEnhanceArticle({ fm, body, activity, forceRetranslate = false, cacheOnly = false }) {
  const needsRetranslate =
    forceRetranslate ||
    spanishRatio(fm.summary) > 0.2 ||
    spanishRatio(body) > 0.12 ||
    !hasCyrillic(fm.title);

  let translation = null;
  if (activity && needsRetranslate) {
    translation = await translateActivity(activity);
  } else if (needsRetranslate) {
    const bodyParagraphs = await translateExistingBody(body, { cacheOnly });
    const titleRu =
      (await translateToRu(fm.title_es ?? fm.title_en ?? fm.title, {
        preferLang: "es",
        cacheOnly,
      })) || "";
    const summaryRu =
      (await translateToRu(fm.summary || fm.title_es || fm.title, {
        preferLang: "es",
        cacheOnly,
      })) || "";
    translation = {
      title: titleRu,
      summary: summaryRu,
      bodyParagraphs,
      facts: {},
    };
  }

  const nextFm = { ...fm };
  nextFm.title = resolveRussianTitle(fm, translation);
  if (translation?.summary && hasCyrillic(translation.summary)) {
    nextFm.summary = translation.summary.slice(0, 320);
  }

  nextFm.tags = translateTags(nextFm.tags ?? []);
  if (!nextFm.tags.length && nextFm.region_id) {
    nextFm.tags = [REGION_LABEL[nextFm.region_id]?.toLowerCase() ?? "туризм"].filter(Boolean);
  }

  const coords = parseCoordinates(nextFm);
  if (coords) nextFm.coordinates = coords;

  let nextBody = body;
  if (translation && (translation.bodyParagraphs?.length || Object.keys(translation.facts ?? {}).length)) {
    nextBody = buildEditorialBody(nextFm, translation);
  } else if (needsRetranslate || body.length < 250 || spanishRatio(body) > 0.1) {
    nextBody = expandThinBody(nextFm, body, translation);
  } else {
    nextBody = cleanupBody(body);
  }

  if (nextFm.media?.hero && hasCyrillic(nextFm.title)) {
    nextFm.media = {
      ...nextFm.media,
      hero: { ...nextFm.media.hero, alt: nextFm.title },
      gallery: (nextFm.media.gallery ?? []).map((g) => ({ ...g, alt: g.alt ?? nextFm.title })),
    };
  }

  if (isReadyForPublish(nextFm, nextBody)) {
    nextFm.status = "published";
    nextFm.site_ready = true;
    nextFm.confidence = nextFm.confidence === "low" ? "medium" : nextFm.confidence ?? "medium";
  }

  return { fm: nextFm, body: nextBody, translation, promoted: nextFm.site_ready === true };
}

export { applyGlossary };
