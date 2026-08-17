/**
 * Загрузчик данных «Базы знаний» (server-side, build-time).
 * Читает сгенерированные индексы из content/knowledge-base/_index/.
 * В проекте нет runtime-парсера Markdown — структура генерируется скриптом
 * build_manifest.py в JSON, а здесь только читается (как и контент блога).
 */
import fs from "node:fs";
import path from "node:path";

import type {
  KbEntry,
  KbNavigation,
  KbSearchItem,
  KbSectionMeta,
} from "./types";
import { entryHref } from "./urls";
import { isPublicKbEntry } from "./publication-quality";

const KB_INDEX_DIR = path.join(
  process.cwd(),
  "content",
  "knowledge-base",
  "_index",
);

function readJson<T>(fileName: string): T {
  const raw = fs.readFileSync(path.join(KB_INDEX_DIR, fileName), "utf-8");
  return JSON.parse(raw) as T;
}

// ── Кэши (модуль загружается один раз на процесс сборки) ────────────────────

let allEntriesCache: KbEntry[] | null = null;
let entriesCache: KbEntry[] | null = null;
let byIdCache: Map<string, KbEntry> | null = null;
let archivedIdsCache: Set<string> | null = null;
let navigationCache: KbNavigation | null = null;

function loadAllEntries(): KbEntry[] {
  if (!allEntriesCache) {
    const data = readJson<{ entities: KbEntry[] }>("content.json");
    allEntriesCache = data.entities;
    archivedIdsCache = new Set(
      allEntriesCache
        .filter((entry) => entry.status === "archived")
        .map((entry) => entry.id),
    );
  }
  return allEntriesCache;
}

function loadEntries(): KbEntry[] {
  if (!entriesCache) {
    // Один фильтр управляет всеми публичными каналами: страницами, поиском,
    // картой, рекомендациями и sitemap. Исходники карантинных записей сохраняются.
    entriesCache = loadAllEntries().filter(isPublicKbEntry);
    byIdCache = new Map(entriesCache.map((entry) => [entry.id, entry]));
  }
  return entriesCache;
}

export function getNavigation(): KbNavigation {
  if (!navigationCache) navigationCache = readJson<KbNavigation>("navigation.json");
  return navigationCache;
}

export function getAllEntries(): KbEntry[] {
  return loadEntries();
}

export function getEntry(id: string): KbEntry | undefined {
  loadEntries();
  return byIdCache?.get(id);
}

/**
 * Resolves an id to a public catalog entry, following archive redirect_to when present.
 * Used for [[wikilinks]] and related panels so archived neighbours are not dead ends.
 */
export function resolvePublicKbId(id: string): string | undefined {
  loadEntries();
  if (byIdCache?.has(id)) return id;
  const archived = loadAllEntries().find((entry) => entry.id === id);
  const target = archived?.redirect_to?.trim();
  if (target && byIdCache?.has(target)) return target;
  return undefined;
}

/** Identity + archive→canonical map for markdown [[wikilinks]]. */
export function buildKbWikilinkTargets(): Map<string, string> {
  loadEntries();
  const map = new Map<string, string>();
  for (const id of byIdCache?.keys() ?? []) {
    map.set(id, id);
  }
  for (const entry of loadAllEntries()) {
    if (entry.status !== "archived") continue;
    const target = entry.redirect_to?.trim();
    if (target && byIdCache?.has(target)) {
      map.set(entry.id, target);
    }
  }
  return map;
}

export function getAllEntryIds(): string[] {
  return loadEntries().map((entry) => entry.id);
}

/** Архивные id — tombstone: CMS не может случайно вернуть их в публичную выдачу. */
export function getArchivedEntryIds(): ReadonlySet<string> {
  loadAllEntries();
  return archivedIdsCache ?? new Set<string>();
}

// ── Канонические разделы сайта (site_sections) ──────────────────────────────

export const KB_SECTIONS: KbSectionMeta[] = [
  {
    id: "puteshestviya-po-argentine",
    slug: "puteshestviya",
    title: "Путешествия по Аргентине",
    description:
      "Маршруты, направления, сезоны, бюджет и подготовка к поездке.",
    icon: "🧭",
  },
  {
    id: "goroda-i-regiony",
    slug: "goroda-i-regiony",
    title: "Города и регионы",
    description:
      "Города, провинции, национальные парки и достопримечательности.",
    icon: "🗺️",
  },
  {
    id: "zhizn-v-strane",
    slug: "zhizn-v-strane",
    title: "Жизнь в стране",
    description:
      "Быт, культура, медицина, связь, безопасность и адаптация.",
    icon: "🏡",
  },
  {
    id: "pereezd-v-argentinu",
    slug: "pereezd",
    title: "Переезд в Аргентину",
    description:
      "Пошаговый путь релоканта: от решения и подготовки документов до переезда и интеграции.",
    icon: "🧳",
  },
  {
    id: "dokumenty-i-legalizatsiya",
    slug: "dokumenty",
    title: "Документы и легализация",
    description:
      "Виза, ВНЖ, DNI, гражданство, апостиль и признание диплома.",
    icon: "📄",
  },
  {
    id: "finansy-i-ekonomika",
    slug: "finansy",
    title: "Финансы и экономика",
    description:
      "Деньги, обмен валюты, налоги, инфляция и защита накоплений.",
    icon: "💵",
  },
  {
    id: "lichnyy-opyt",
    slug: "lichnyy-opyt",
    title: "Личный опыт",
    description:
      "Личные истории переезда, путешествий и жизни в Аргентине с практическими выводами.",
    icon: "✍️",
  },
];

const sectionBySlug = new Map(KB_SECTIONS.map((s) => [s.slug, s]));
const sectionById = new Map(KB_SECTIONS.map((s) => [s.id, s]));

export function getSectionBySlug(slug: string): KbSectionMeta | undefined {
  return sectionBySlug.get(slug);
}

export function getSectionMeta(id: string): KbSectionMeta | undefined {
  return sectionById.get(id);
}

/** Записи раздела (по id site_section), хабы вынесены вперёд, затем по типу. */
export function getSectionEntries(sectionId: string): KbEntry[] {
  return getSectionEntriesFrom(loadEntries(), sectionId);
}

export function getSectionEntriesFrom(entries: KbEntry[], sectionId: string): KbEntry[] {
  const matching = entries.filter((entry) =>
    (entry.site_sections ?? []).includes(sectionId),
  );
  return matching.sort((a, b) => {
    const aHub = isHub(a.id) ? 0 : 1;
    const bHub = isHub(b.id) ? 0 : 1;
    if (aHub !== bHub) return aHub - bHub;
    return a.title.localeCompare(b.title, "ru");
  });
}

export function getSectionCount(sectionId: string): number {
  return getSectionCountFrom(loadEntries(), sectionId);
}

export function getSectionCountFrom(entries: KbEntry[], sectionId: string): number {
  return entries.filter((entry) =>
    (entry.site_sections ?? []).includes(sectionId),
  ).length;
}

// ── Хабы (точки входа) ──────────────────────────────────────────────────────

/** Порядок хабов: сначала journey-хабы, затем тематические. */
export const KB_HUB_ORDER: string[] = [
  "gid-puteshestvennika",
  "chek-list-pereezda",
  "byudzhet-poezdki",
  "kakie-dokumenty-vezti-s-soboj",
  "gid-po-zhilyu",
  "medicina-i-strahovka",
  "gid-po-transportu",
  "gid-po-kulture",
];

const hubIdSet = new Set(KB_HUB_ORDER);

export function isHub(id: string): boolean {
  return hubIdSet.has(id);
}

export function getHubs(): KbEntry[] {
  loadEntries();
  return KB_HUB_ORDER.map((id) => byIdCache?.get(id)).filter(
    (entry): entry is KbEntry => Boolean(entry),
  );
}

// ── Связи, крошки, соседи, поиск ────────────────────────────────────────────

export function getRelated(entry: KbEntry, limit = 6): KbEntry[] {
  loadEntries();
  const seen = new Set<string>([entry.id]);
  const result: KbEntry[] = [];
  for (const id of entry.related ?? []) {
    if (seen.has(id)) continue;
    const resolvedId = resolvePublicKbId(id);
    const target = resolvedId ? byIdCache?.get(resolvedId) : undefined;
    if (target) {
      result.push(target);
      seen.add(target.id);
      seen.add(id);
    }
    if (result.length >= limit) break;
  }
  // Бэкфилл соседями раздела, чтобы у статьи никогда не было «тупика».
  if (result.length < limit) {
    const primarySectionId = (entry.site_sections ?? [])[0];
    if (primarySectionId) {
      for (const sibling of getSectionEntries(primarySectionId)) {
        if (result.length >= limit) break;
        if (seen.has(sibling.id) || isHub(sibling.id)) continue;
        result.push(sibling);
        seen.add(sibling.id);
      }
    }
  }
  return result;
}

/** Раздел записи (по первому site_section). */
export function getEntrySection(entry: KbEntry): KbSectionMeta | undefined {
  const primarySectionId = (entry.site_sections ?? [])[0];
  return primarySectionId ? sectionById.get(primarySectionId) : undefined;
}

/** Порядок и подписи типов для сгруппированного листинга раздела. */
export const KB_TYPE_GROUP_ORDER: { type: string; label: string }[] = [
  { type: "guide", label: "Руководства" },
  { type: "region", label: "Регионы" },
  { type: "city", label: "Города" },
  { type: "national_park", label: "Национальные парки" },
  { type: "attraction", label: "Достопримечательности" },
  { type: "route", label: "Маршруты" },
  { type: "transport", label: "Транспорт" },
  { type: "faq", label: "Вопросы и ответы" },
  { type: "author_tip", label: "Личный опыт" },
];

/** Группирует записи раздела по типам (хабы отдельно первыми). */
export function getSectionGroups(sectionId: string): {
  hubs: KbEntry[];
  groups: { type: string; label: string; entries: KbEntry[] }[];
} {
  return getSectionGroupsFrom(loadEntries(), sectionId);
}

export function getSectionGroupsFrom(entries: KbEntry[], sectionId: string): {
  hubs: KbEntry[];
  groups: { type: string; label: string; entries: KbEntry[] }[];
} {
  const all = getSectionEntriesFrom(entries, sectionId);
  const hubs = all.filter((entry) => isHub(entry.id));
  const rest = all.filter((entry) => !isHub(entry.id));
  const groups = KB_TYPE_GROUP_ORDER.map(({ type, label }) => ({
    type,
    label,
    entries: rest
      .filter((entry) => entry.type === type)
      .sort((a, b) => a.title.localeCompare(b.title, "ru")),
  })).filter((group) => group.entries.length > 0);
  return { hubs, groups };
}

export interface KbCrumb {
  label: string;
  href: string;
}

export function getBreadcrumbs(entry: KbEntry): KbCrumb[] {
  const crumbs: KbCrumb[] = [
    { label: "Главная", href: "/" },
    { label: "База знаний", href: "/baza-znaniy" },
  ];
  const primarySectionId = (entry.site_sections ?? [])[0];
  const section = primarySectionId ? sectionById.get(primarySectionId) : undefined;
  if (section) {
    crumbs.push({
      label: section.title,
      href: `/baza-znaniy/razdel/${section.slug}`,
    });
  }
  crumbs.push({ label: entry.title, href: entryHref(entry.id) });
  return crumbs;
}

/** Предыдущая/следующая запись внутри первого раздела. */
export function getSectionNeighbours(entry: KbEntry): {
  prev?: KbEntry;
  next?: KbEntry;
} {
  const primarySectionId = (entry.site_sections ?? [])[0];
  if (!primarySectionId) return {};
  const list = getSectionEntries(primarySectionId);
  const idx = list.findIndex((e) => e.id === entry.id);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? list[idx - 1] : undefined,
    next: idx < list.length - 1 ? list[idx + 1] : undefined,
  };
}

export function getSearchIndex(): KbSearchItem[] {
  return getSearchIndexFrom(loadEntries());
}

export function getSearchIndexFrom(entries: KbEntry[]): KbSearchItem[] {
  return entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    summary: entry.summary ?? "",
    type: entry.type,
    section: (entry.site_sections ?? [])[0] ?? "",
    aliases: entry.aliases ?? [],
    tags: entry.tags ?? [],
  }));
}

// ── URL-хелперы (реэкспорт из клиент-безопасного модуля) ────────────────────

export { entryHref, sectionHref } from "./urls";
