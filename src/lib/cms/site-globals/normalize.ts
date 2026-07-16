import { SITE_INSTAGRAM_URL, SITE_TELEGRAM_URL } from "@/data/site-contacts";
import type {
  SiteBrandingGlobal,
  SiteBrandingTranslatable,
  SiteContactGlobal,
  SiteContactTranslatable,
  SiteDesignGlobal,
  SiteFeaturesGlobal,
  SiteGlobalLocaleOverrides,
  SiteLegalGlobal,
  SiteLegalTranslatable,
  SiteMaintenanceGlobal,
  SiteMaintenanceTranslatable,
  SiteSeoGlobal,
  SiteSeoTranslatable,
  SiteNavigationGlobal,
} from "@/types/site-globals";

export const DEFAULT_SITE_BRANDING_LOCALES: SiteGlobalLocaleOverrides<SiteBrandingTranslatable> = {
  en: {
    tagline: "travel in Argentina",
    defaultTitle: "Go Argentina — travel in Argentina",
  },
  es: {
    tagline: "viajes por Argentina",
    defaultTitle: "Hora de ir a Argentina — viajes por Argentina",
  },
};

export const DEFAULT_SITE_SEO_LOCALES: SiteGlobalLocaleOverrides<SiteSeoTranslatable> = {
  en: {
    defaultDescription:
      "Curated tours and excursions across Argentina: Patagonia, Buenos Aires, Mendoza, Iguazú. Russian-speaking guides and organizers.",
  },
  es: {
    defaultDescription:
      "Tours y excursiones por Argentina: Patagonia, Buenos Aires, Mendoza, Iguazú. Guías y organizadores de confianza.",
  },
};

export const DEFAULT_SITE_MAINTENANCE_LOCALES: SiteGlobalLocaleOverrides<SiteMaintenanceTranslatable> = {
  en: {
    badgeLabel: "Opening soon",
    headline: "Something special is coming",
    message:
      "We are updating the site — soon we will be back with an improved tour catalog and services for Argentina.",
    notifyLabel: "Be the first to know:",
  },
  es: {
    badgeLabel: "Pronto abrimos",
    headline: "Preparamos algo especial",
    message:
      "Estamos actualizando el sitio — pronto volvemos con un catálogo de tours y servicios mejorado para Argentina.",
    notifyLabel: "Entérese primero:",
  },
};

export const DEFAULT_SITE_LEGAL_LOCALES: SiteGlobalLocaleOverrides<SiteLegalTranslatable> = {
  en: { companyName: "Go Argentina" },
  es: { companyName: "Hora de ir a Argentina" },
};

export const DEFAULT_SITE_BRANDING: SiteBrandingGlobal = {
  siteName: "Пора в Аргентину",
  tagline: "путешествия по Аргентине",
  defaultTitle: "Пора в Аргентину — путешествия по Аргентине",
  titleTemplate: "%s | Пора в Аргентину",
  defaultOgImage: "/logo-light.svg",
  themeColor: "#74acdf",
  faviconUrl: "/favicon.ico",
  appleTouchIconUrl: "/apple-touch-icon.png",
  locales: DEFAULT_SITE_BRANDING_LOCALES,
};

export const DEFAULT_SITE_SEO: SiteSeoGlobal = {
  defaultDescription:
    "Авторские туры и экскурсии по Аргентине: Патагония, Буэнос-Айрес, Мендоса, Игуасу. Русскоязычные гиды и организаторы.",
  twitterHandle: "",
  allowIndexing: true,
  locales: DEFAULT_SITE_SEO_LOCALES,
};

export const DEFAULT_SITE_CONTACT: SiteContactGlobal = {
  supportEmail: "hello@goargentina.ru",
  telegramUrl: SITE_TELEGRAM_URL,
  whatsAppUrl: "",
  instagramUrl: SITE_INSTAGRAM_URL,
  contactPageIntro: "",
};

export const DEFAULT_SITE_FEATURES: SiteFeaturesGlobal = {
  maintenanceMode: false,
  allowOrganizerSignup: true,
  cmsBlogCutover: false,
  cmsGuideCutover: false,
  cmsDestinationCutover: false,
  cmsPlaceCutover: false,
};

export const DEFAULT_SITE_MAINTENANCE: SiteMaintenanceGlobal = {
  badgeLabel: "Скоро откроемся",
  headline: "Готовим кое-что особенное",
  message:
    "Сейчас мы обновляем сайт — скоро вернёмся с улучшенным каталогом туров и сервисов по Аргентине.",
  notifyLabel: "Узнайте о запуске первыми:",
  showContacts: true,
  countdownEnabled: false,
  locales: DEFAULT_SITE_MAINTENANCE_LOCALES,
};

export const DEFAULT_SITE_NAVIGATION: SiteNavigationGlobal = {
  showGeography: true,
  showTours: true,
  showExcursions: true,
  showGuide: true,
  showGallery: true,
  showImmigration: true,
  showKnowledgeBase: true,
  showShop: true,
  showServices: true,
  showJournal: true,
  showAbout: true,
  utilityToursLabel: "Бронируйте лучшие туры",
  utilityToursUrl: "/tours",
  utilityOrganizerLabel: "Авторам туров",
  utilityOrganizerUrl: "/join",
  utilityContactLabel: "Свяжитесь с нами",
  utilityContactUrl: "/contacts",
};

export const DEFAULT_SITE_DESIGN: SiteDesignGlobal = {
  palettePreset: "argentina",
  headingFont: "unbounded",
  headerVariant: "floating",
  footerVariant: "light",
  showUtilityBar: false,
  showHeaderMapButton: true,
  showThemeToggle: true,
  showFooterNewsletter: true,
  showFooterRouteCta: true,
};

function normalizeNavigationHref(value: unknown, fallback: string): string {
  const href = asString(value).trim();
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^https:\/\//i.test(href)) return href;
  return fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asAllowedValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function parseLocaleOverrides<T extends Record<string, string>>(
  raw: unknown,
  fieldNames: readonly (keyof T)[],
  defaults: SiteGlobalLocaleOverrides<T>,
): SiteGlobalLocaleOverrides<T> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaults;
  }

  const source = raw as Record<string, unknown>;
  const out: SiteGlobalLocaleOverrides<T> = {};

  for (const locale of ["en", "es"] as const) {
    const block = source[locale];
    if (!block || typeof block !== "object" || Array.isArray(block)) {
      if (defaults[locale]) {
        out[locale] = { ...defaults[locale] };
      }
      continue;
    }

    const row = block as Record<string, unknown>;
    const merged = { ...defaults[locale] } as Partial<T>;
    for (const field of fieldNames) {
      const val = row[field as string];
      if (typeof val === "string" && val.trim()) {
        merged[field] = val as T[keyof T];
      }
    }
    if (Object.keys(merged).length > 0) {
      out[locale] = merged;
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

export function normalizeSiteLegal(value: unknown): SiteLegalGlobal {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const r = value as Record<string, unknown>;
  return {
    companyName: asString(r.companyName) || undefined,
    inn: asString(r.inn) || undefined,
    ogrn: asString(r.ogrn) || undefined,
    address: asString(r.address) || undefined,
    supportEmail: asString(r.supportEmail) || undefined,
    locales: parseLocaleOverrides<SiteLegalTranslatable>(
      r.locales,
      ["companyName"],
      DEFAULT_SITE_LEGAL_LOCALES,
    ),
  };
}

export function normalizeSiteFeatures(value: unknown): SiteFeaturesGlobal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_SITE_FEATURES;
  }
  const r = value as Record<string, unknown>;
  return {
    maintenanceMode: r.maintenanceMode === true,
    allowOrganizerSignup: r.allowOrganizerSignup !== false,
    cmsBlogCutover: r.cmsBlogCutover === true,
    cmsGuideCutover: r.cmsGuideCutover === true,
    cmsDestinationCutover: r.cmsDestinationCutover === true,
    cmsPlaceCutover: r.cmsPlaceCutover === true,
  };
}

export function normalizeSiteNavigation(value: unknown): SiteNavigationGlobal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_SITE_NAVIGATION;
  }
  const row = value as Record<string, unknown>;
  return {
    showGeography: row.showGeography !== false,
    showTours: row.showTours !== false,
    showExcursions: row.showExcursions !== false,
    showGuide: row.showGuide !== false,
    showGallery: row.showGallery !== false,
    showImmigration: row.showImmigration !== false,
    showKnowledgeBase: row.showKnowledgeBase !== false,
    showShop: row.showShop !== false,
    showServices: row.showServices !== false,
    showJournal: row.showJournal !== false,
    showAbout: row.showAbout !== false,
    utilityToursLabel: asString(row.utilityToursLabel, DEFAULT_SITE_NAVIGATION.utilityToursLabel),
    utilityToursUrl: normalizeNavigationHref(row.utilityToursUrl, DEFAULT_SITE_NAVIGATION.utilityToursUrl),
    utilityOrganizerLabel: asString(row.utilityOrganizerLabel, DEFAULT_SITE_NAVIGATION.utilityOrganizerLabel),
    utilityOrganizerUrl: normalizeNavigationHref(row.utilityOrganizerUrl, DEFAULT_SITE_NAVIGATION.utilityOrganizerUrl),
    utilityContactLabel: asString(row.utilityContactLabel, DEFAULT_SITE_NAVIGATION.utilityContactLabel),
    utilityContactUrl: normalizeNavigationHref(row.utilityContactUrl, DEFAULT_SITE_NAVIGATION.utilityContactUrl),
  };
}

export function normalizeSiteDesign(value: unknown): SiteDesignGlobal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_SITE_DESIGN;
  }
  const row = value as Record<string, unknown>;
  return {
    palettePreset: asAllowedValue(
      row.palettePreset,
      ["argentina", "patagonia", "wine"] as const,
      DEFAULT_SITE_DESIGN.palettePreset,
    ),
    headingFont: asAllowedValue(
      row.headingFont,
      ["unbounded", "serif", "system"] as const,
      DEFAULT_SITE_DESIGN.headingFont,
    ),
    headerVariant: asAllowedValue(
      row.headerVariant,
      ["floating", "compact"] as const,
      DEFAULT_SITE_DESIGN.headerVariant,
    ),
    footerVariant: asAllowedValue(
      row.footerVariant,
      ["light", "mist"] as const,
      DEFAULT_SITE_DESIGN.footerVariant,
    ),
    showUtilityBar: asBool(row.showUtilityBar, DEFAULT_SITE_DESIGN.showUtilityBar),
    showHeaderMapButton: asBool(
      row.showHeaderMapButton,
      DEFAULT_SITE_DESIGN.showHeaderMapButton,
    ),
    showThemeToggle: asBool(row.showThemeToggle, DEFAULT_SITE_DESIGN.showThemeToggle),
    showFooterNewsletter: asBool(
      row.showFooterNewsletter,
      DEFAULT_SITE_DESIGN.showFooterNewsletter,
    ),
    showFooterRouteCta: asBool(
      row.showFooterRouteCta,
      DEFAULT_SITE_DESIGN.showFooterRouteCta,
    ),
  };
}

export function normalizeSiteMaintenance(value: unknown): SiteMaintenanceGlobal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_SITE_MAINTENANCE;
  }
  const r = value as Record<string, unknown>;
  return {
    badgeLabel: asString(r.badgeLabel, DEFAULT_SITE_MAINTENANCE.badgeLabel),
    headline: asString(r.headline, DEFAULT_SITE_MAINTENANCE.headline),
    message: asString(r.message, DEFAULT_SITE_MAINTENANCE.message),
    notifyLabel: asString(r.notifyLabel, DEFAULT_SITE_MAINTENANCE.notifyLabel),
    backgroundImage: asString(r.backgroundImage) || undefined,
    showContacts: r.showContacts !== false,
    countdownEnabled: r.countdownEnabled === true,
    countdownTarget: asString(r.countdownTarget) || undefined,
    locales: parseLocaleOverrides<SiteMaintenanceTranslatable>(
      r.locales,
      ["badgeLabel", "headline", "message", "notifyLabel"],
      DEFAULT_SITE_MAINTENANCE_LOCALES,
    ),
  };
}

export function normalizeSiteBranding(value: unknown): SiteBrandingGlobal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_SITE_BRANDING;
  }
  const r = value as Record<string, unknown>;
  return {
    siteName: asString(r.siteName, DEFAULT_SITE_BRANDING.siteName),
    tagline: asString(r.tagline, DEFAULT_SITE_BRANDING.tagline),
    defaultTitle: asString(r.defaultTitle, DEFAULT_SITE_BRANDING.defaultTitle),
    titleTemplate: asString(r.titleTemplate, DEFAULT_SITE_BRANDING.titleTemplate),
    defaultOgImage: asString(r.defaultOgImage, DEFAULT_SITE_BRANDING.defaultOgImage),
    themeColor: asString(r.themeColor, DEFAULT_SITE_BRANDING.themeColor),
    faviconUrl: asString(r.faviconUrl, DEFAULT_SITE_BRANDING.faviconUrl ?? "/favicon.ico"),
    appleTouchIconUrl: asString(
      r.appleTouchIconUrl,
      DEFAULT_SITE_BRANDING.appleTouchIconUrl ?? "/apple-touch-icon.png"
    ),
    locales: parseLocaleOverrides<SiteBrandingTranslatable>(
      r.locales,
      ["tagline", "defaultTitle"],
      DEFAULT_SITE_BRANDING_LOCALES,
    ),
  };
}

export function normalizeSiteSeo(value: unknown): SiteSeoGlobal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_SITE_SEO;
  }
  const r = value as Record<string, unknown>;
  return {
    defaultDescription: asString(r.defaultDescription, DEFAULT_SITE_SEO.defaultDescription),
    twitterHandle: asString(r.twitterHandle) || undefined,
    allowIndexing: r.allowIndexing !== false,
    googleSiteVerification: asString(r.googleSiteVerification) || undefined,
    bingSiteVerification: asString(r.bingSiteVerification) || undefined,
    ahrefsSiteVerification: asString(r.ahrefsSiteVerification) || undefined,
    yandexSiteVerification: asString(r.yandexSiteVerification) || undefined,
    locales: parseLocaleOverrides<SiteSeoTranslatable>(
      r.locales,
      ["defaultDescription"],
      DEFAULT_SITE_SEO_LOCALES,
    ),
  };
}

export function normalizeSiteContact(value: unknown): SiteContactGlobal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_SITE_CONTACT;
  }
  const r = value as Record<string, unknown>;
  return {
    supportEmail: asString(r.supportEmail, DEFAULT_SITE_CONTACT.supportEmail),
    telegramUrl: asString(r.telegramUrl).trim() || DEFAULT_SITE_CONTACT.telegramUrl || undefined,
    whatsAppUrl: asString(r.whatsAppUrl).trim() || undefined,
    instagramUrl: asString(r.instagramUrl).trim() || DEFAULT_SITE_CONTACT.instagramUrl || undefined,
    contactPageIntro: asString(r.contactPageIntro) || undefined,
    locales: parseLocaleOverrides<SiteContactTranslatable>(
      r.locales,
      ["contactPageIntro"],
      {},
    ),
  };
}

/** Strip empty optional strings before save. */
export function sanitizeGlobalForSave<T extends Record<string, unknown>>(value: T): T {
  const out = { ...value } as Record<string, unknown>;

  if (out.locales && typeof out.locales === "object" && !Array.isArray(out.locales)) {
    const locales = { ...(out.locales as Record<string, Record<string, unknown>>) };
    for (const locale of Object.keys(locales)) {
      const block = { ...locales[locale] };
      for (const [key, val] of Object.entries(block)) {
        if (typeof val === "string" && val.trim() === "") {
          delete block[key];
        }
      }
      if (Object.keys(block).length === 0) {
        delete locales[locale];
      } else {
        locales[locale] = block;
      }
    }
    if (Object.keys(locales).length === 0) {
      delete out.locales;
    } else {
      out.locales = locales;
    }
  }

  for (const [key, val] of Object.entries(out)) {
    if (key === "locales") continue;
    if (typeof val === "string" && val.trim() === "" && key !== "siteName" && key !== "supportEmail") {
      delete out[key];
    }
  }
  return out as T;
}
