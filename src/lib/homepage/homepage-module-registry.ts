/**
 * Homepage body modules — wraps existing MarketplaceHome sections.
 * Default order matches the current public vertical; hero stays outside this strip.
 * Optional override is for a future site.homepage global (not required for identical UI).
 */

export const HOMEPAGE_BODY_MODULE_IDS = [
  "travel-prep",
  "tours-lead",
  "platform-stats",
  "geography",
  "offers",
  "testimonials",
  "journal",
  "guide-hub",
] as const;

export type HomepageBodyModuleId = (typeof HOMEPAGE_BODY_MODULE_IDS)[number];

export const HOMEPAGE_BODY_MODULE_DEFAULT_ORDER: readonly HomepageBodyModuleId[] =
  HOMEPAGE_BODY_MODULE_IDS;

export type HomepageBodyModuleMeta = {
  id: HomepageBodyModuleId;
  label: string;
  description: string;
};

export const HOMEPAGE_BODY_MODULE_META: Record<HomepageBodyModuleId, HomepageBodyModuleMeta> = {
  "travel-prep": {
    id: "travel-prep",
    label: "Подготовка к поездке",
    description: "Полоса сервисов под hero (если включена навигация)",
  },
  "tours-lead": {
    id: "tours-lead",
    label: "Туры: поиск или ценность",
    description: "Результаты поиска либо блок «Почему с нами»",
  },
  "platform-stats": {
    id: "platform-stats",
    label: "Статистика площадки",
    description: "Цифры каталога под ценностным блоком",
  },
  geography: {
    id: "geography",
    label: "Регионы и места",
    description: "Географическая полка направлений",
  },
  offers: {
    id: "offers",
    label: "Актуальные предложения",
    description: "Лента рекомендованных туров",
  },
  testimonials: {
    id: "testimonials",
    label: "Отзывы",
    description: "Социальное доказательство на главной",
  },
  journal: {
    id: "journal",
    label: "Блог",
    description: "Карточки статей из журнала",
  },
  "guide-hub": {
    id: "guide-hub",
    label: "Путеводитель и иммиграция",
    description: "Тёмный хаб справочных разделов",
  },
};

/** Resolve module order; unknown ids dropped; missing slots appended from default. */
export function resolveHomepageBodyModuleOrder(
  override?: readonly string[] | null,
): HomepageBodyModuleId[] {
  if (!override?.length) {
    return [...HOMEPAGE_BODY_MODULE_DEFAULT_ORDER];
  }

  const allowed = new Set<string>(HOMEPAGE_BODY_MODULE_IDS);
  const seen = new Set<HomepageBodyModuleId>();
  const ordered: HomepageBodyModuleId[] = [];

  for (const raw of override) {
    if (!allowed.has(raw)) continue;
    const id = raw as HomepageBodyModuleId;
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
  }

  for (const id of HOMEPAGE_BODY_MODULE_DEFAULT_ORDER) {
    if (seen.has(id)) continue;
    ordered.push(id);
  }

  return ordered;
}
