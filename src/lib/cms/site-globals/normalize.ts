import { SITE_INSTAGRAM_URL, SITE_TELEGRAM_URL } from "@/data/site-contacts";
import type {
  SiteBrandingGlobal,
  SiteBrandingTranslatable,
  SiteBlogGlobal,
  SiteCommerceGlobal,
  SiteContactGlobal,
  SiteContactTranslatable,
  SiteDesignGlobal,
  SiteFeaturesGlobal,
  SiteGlobalLocaleOverrides,
  SiteLegalGlobal,
  SiteLegalTranslatable,
  SiteMaintenanceGlobal,
  SiteFormsGlobal,
  SiteEmailGlobal,
  SiteMarketingGlobal,
  SiteMaintenanceTranslatable,
  SiteModulesGlobal,
  SiteSeoGlobal,
  SiteSeoTranslatable,
  SiteNavigationGlobal,
  SiteGlobalKey,
  SiteGlobalsMap,
} from "@/types/site-globals";
import { SITE_PUBLIC_MODULE_IDS } from "@/types/site-globals";

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
  primaryLogoUrl: "/logo-light.svg",
  footerLogoUrl: "/logo-light.svg",
  logoAlt: "Пора в Аргентину",
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
  youtubeUrl: "",
  tiktokUrl: "",
  facebookUrl: "",
  xUrl: "",
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
  showDestinations: true,
  showPlaces: true,
  showTours: true,
  showExcursions: true,
  showGuide: true,
  showGallery: true,
  showImmigration: false,
  showKnowledgeBase: true,
  showForum: false,
  showShop: false,
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
  typographyScale: "balanced",
  cornerStyle: "rounded",
  headerVariant: "floating",
  footerVariant: "light",
  showUtilityBar: false,
  showHeaderMapButton: true,
  showSiteSearch: true,
  showThemeToggle: true,
  showCustomCursor: true,
  showScrollToTop: true,
  showScrollToTopMobile: false,
  showRouteProgress: true,
  showFooterNewsletter: true,
  showFooterRouteCta: true,
};

export const DEFAULT_SITE_BLOG: SiteBlogGlobal = {
  showShare: true,
  showComments: true,
  showAuthor: true,
  showRelatedPosts: true,
  showPrevNext: true,
  showNewsletter: true,
  relatedPostsCount: "3",
};

export const DEFAULT_SITE_COMMERCE: SiteCommerceGlobal = {
  catalogColumns: "3",
  catalogPageSize: "9",
  showCatalogIntro: true,
  showProductFormat: true,
  showProductPrice: true,
  showProductQuestions: true,
  showRelatedProducts: true,
  relatedProductsCount: "3",
};

export const DEFAULT_SITE_MODULES: SiteModulesGlobal = {
  apartmentsMode: "request",
  carRentalMode: "disabled",
  transfersMode: "partner",
  hotelsMode: "planned",
  showApartmentsInServices: true,
  showCarRentalInServices: true,
  showTransfersInServices: true,
  publicModules: Object.fromEntries(
    SITE_PUBLIC_MODULE_IDS.map((id) => {
      const hiddenByDefault = id === "shop" || id === "forum" || id === "immigration";
      return [
        id,
        {
          activated: !hiddenByDefault,
          published: !hiddenByDefault,
          includeInSearch: !hiddenByDefault,
          includeInSitemap: !hiddenByDefault,
        },
      ];
    }),
  ) as SiteModulesGlobal["publicModules"],
};

export const DEFAULT_SITE_FORMS: SiteFormsGlobal = {
  contactEnabled: true,
  newsletterEnabled: true,
  captchaMode: "off",
  captchaContact: true,
  captchaNewsletter: true,
  captchaNativeBooking: true,
  captchaWaitlist: true,
  captchaShopOrder: true,
  captchaPartnerBooking: true,
};

export const DEFAULT_SITE_EMAIL: SiteEmailGlobal = {
  senderName: "Пора в Аргентину",
  footerText: "Настройки уведомлений можно изменить в личном кабинете.",
  leadAlertsEnabled: true,
  organizerAlertsEnabled: true,
  dailyDigestEnabled: true,
  contentFreshnessAlertsEnabled: true,
};

export const DEFAULT_SITE_MARKETING: SiteMarketingGlobal = {
  announcementEnabled: false,
  announcementText: "",
  announcementCtaLabel: "Подробнее",
  announcementHref: "/services",
  announcementTone: "sky",
  announcementOnMobile: true,
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
    showGeography: asBool(row.showGeography, DEFAULT_SITE_NAVIGATION.showGeography),
    showDestinations: asBool(row.showDestinations, DEFAULT_SITE_NAVIGATION.showDestinations),
    showPlaces: asBool(row.showPlaces, DEFAULT_SITE_NAVIGATION.showPlaces),
    showTours: asBool(row.showTours, DEFAULT_SITE_NAVIGATION.showTours),
    showExcursions: asBool(row.showExcursions, DEFAULT_SITE_NAVIGATION.showExcursions),
    showGuide: asBool(row.showGuide, DEFAULT_SITE_NAVIGATION.showGuide),
    showGallery: asBool(row.showGallery, DEFAULT_SITE_NAVIGATION.showGallery),
    // Empty/partial CMS rows must not re-enable unfinished modules (opt-in via true).
    showImmigration: asBool(row.showImmigration, DEFAULT_SITE_NAVIGATION.showImmigration),
    showKnowledgeBase: asBool(row.showKnowledgeBase, DEFAULT_SITE_NAVIGATION.showKnowledgeBase),
    showForum: asBool(row.showForum, DEFAULT_SITE_NAVIGATION.showForum),
    showShop: asBool(row.showShop, DEFAULT_SITE_NAVIGATION.showShop),
    showServices: asBool(row.showServices, DEFAULT_SITE_NAVIGATION.showServices),
    showJournal: asBool(row.showJournal, DEFAULT_SITE_NAVIGATION.showJournal),
    showAbout: asBool(row.showAbout, DEFAULT_SITE_NAVIGATION.showAbout),
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
    typographyScale: asAllowedValue(
      row.typographyScale,
      ["compact", "balanced", "editorial"] as const,
      DEFAULT_SITE_DESIGN.typographyScale,
    ),
    cornerStyle: asAllowedValue(
      row.cornerStyle,
      ["soft", "rounded", "expressive"] as const,
      DEFAULT_SITE_DESIGN.cornerStyle,
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
    showSiteSearch: asBool(row.showSiteSearch, DEFAULT_SITE_DESIGN.showSiteSearch),
    showThemeToggle: asBool(row.showThemeToggle, DEFAULT_SITE_DESIGN.showThemeToggle),
    showCustomCursor: asBool(row.showCustomCursor, DEFAULT_SITE_DESIGN.showCustomCursor),
    showScrollToTop: asBool(row.showScrollToTop, DEFAULT_SITE_DESIGN.showScrollToTop),
    showScrollToTopMobile: asBool(
      row.showScrollToTopMobile,
      DEFAULT_SITE_DESIGN.showScrollToTopMobile,
    ),
    showRouteProgress: asBool(row.showRouteProgress, DEFAULT_SITE_DESIGN.showRouteProgress),
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

export function normalizeSiteBlog(value: unknown): SiteBlogGlobal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_SITE_BLOG;
  }
  const row = value as Record<string, unknown>;
  return {
    showShare: asBool(row.showShare, DEFAULT_SITE_BLOG.showShare),
    showComments: asBool(row.showComments, DEFAULT_SITE_BLOG.showComments),
    showAuthor: asBool(row.showAuthor, DEFAULT_SITE_BLOG.showAuthor),
    showRelatedPosts: asBool(row.showRelatedPosts, DEFAULT_SITE_BLOG.showRelatedPosts),
    showPrevNext: asBool(row.showPrevNext, DEFAULT_SITE_BLOG.showPrevNext),
    showNewsletter: asBool(row.showNewsletter, DEFAULT_SITE_BLOG.showNewsletter),
    relatedPostsCount: asAllowedValue(
      row.relatedPostsCount,
      ["3", "4", "6"] as const,
      DEFAULT_SITE_BLOG.relatedPostsCount,
    ),
  };
}

export function normalizeSiteCommerce(value: unknown): SiteCommerceGlobal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_SITE_COMMERCE;
  }
  const row = value as Record<string, unknown>;
  return {
    catalogColumns: asAllowedValue(
      row.catalogColumns,
      ["2", "3", "4"] as const,
      DEFAULT_SITE_COMMERCE.catalogColumns,
    ),
    catalogPageSize: asAllowedValue(
      row.catalogPageSize,
      ["6", "9", "12"] as const,
      DEFAULT_SITE_COMMERCE.catalogPageSize,
    ),
    showCatalogIntro: asBool(row.showCatalogIntro, DEFAULT_SITE_COMMERCE.showCatalogIntro),
    showProductFormat: asBool(row.showProductFormat, DEFAULT_SITE_COMMERCE.showProductFormat),
    showProductPrice: asBool(row.showProductPrice, DEFAULT_SITE_COMMERCE.showProductPrice),
    showProductQuestions: asBool(
      row.showProductQuestions,
      DEFAULT_SITE_COMMERCE.showProductQuestions,
    ),
    showRelatedProducts: asBool(
      row.showRelatedProducts,
      DEFAULT_SITE_COMMERCE.showRelatedProducts,
    ),
    relatedProductsCount: asAllowedValue(
      row.relatedProductsCount,
      ["2", "3", "4"] as const,
      DEFAULT_SITE_COMMERCE.relatedProductsCount,
    ),
  };
}

export function normalizeSiteModules(value: unknown): SiteModulesGlobal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_SITE_MODULES;
  }
  const row = value as Record<string, unknown>;
  const rawPublicModules =
    row.publicModules && typeof row.publicModules === "object" && !Array.isArray(row.publicModules)
      ? (row.publicModules as Record<string, unknown>)
      : {};
  const publicModules = Object.fromEntries(
    SITE_PUBLIC_MODULE_IDS.map((id) => {
      const defaults = DEFAULT_SITE_MODULES.publicModules[id];
      const raw = rawPublicModules[id];
      const moduleRow = raw && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
      return [
        id,
        {
          activated: asBool(moduleRow.activated, defaults.activated),
          published: asBool(moduleRow.published, defaults.published),
          includeInSearch: asBool(moduleRow.includeInSearch, defaults.includeInSearch),
          includeInSitemap: asBool(moduleRow.includeInSitemap, defaults.includeInSitemap),
        },
      ];
    }),
  ) as SiteModulesGlobal["publicModules"];
  return {
    apartmentsMode: asAllowedValue(
      row.apartmentsMode,
      ["disabled", "request", "preparing_native", "native_request"] as const,
      DEFAULT_SITE_MODULES.apartmentsMode,
    ),
    carRentalMode: asAllowedValue(
      row.carRentalMode,
      ["disabled", "partner", "preparing_hybrid"] as const,
      DEFAULT_SITE_MODULES.carRentalMode,
    ),
    transfersMode: asAllowedValue(
      row.transfersMode,
      ["disabled", "request", "partner", "preparing_hybrid"] as const,
      DEFAULT_SITE_MODULES.transfersMode,
    ),
    hotelsMode: asAllowedValue(
      row.hotelsMode,
      ["disabled", "planned"] as const,
      DEFAULT_SITE_MODULES.hotelsMode,
    ),
    showApartmentsInServices: asBool(
      row.showApartmentsInServices,
      DEFAULT_SITE_MODULES.showApartmentsInServices,
    ),
    showCarRentalInServices: asBool(
      row.showCarRentalInServices,
      DEFAULT_SITE_MODULES.showCarRentalInServices,
    ),
    showTransfersInServices: asBool(
      row.showTransfersInServices,
      DEFAULT_SITE_MODULES.showTransfersInServices,
    ),
    publicModules,
  };
}

export function normalizeSiteForms(value: unknown): SiteFormsGlobal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_SITE_FORMS;
  }
  const row = value as Record<string, unknown>;
  return {
    contactEnabled: asBool(row.contactEnabled, DEFAULT_SITE_FORMS.contactEnabled),
    newsletterEnabled: asBool(row.newsletterEnabled, DEFAULT_SITE_FORMS.newsletterEnabled),
    captchaMode: asAllowedValue(
      row.captchaMode,
      ["off", "selected", "all_guest_writes"] as const,
      DEFAULT_SITE_FORMS.captchaMode,
    ),
    captchaContact: asBool(row.captchaContact, DEFAULT_SITE_FORMS.captchaContact),
    captchaNewsletter: asBool(row.captchaNewsletter, DEFAULT_SITE_FORMS.captchaNewsletter),
    captchaNativeBooking: asBool(
      row.captchaNativeBooking,
      DEFAULT_SITE_FORMS.captchaNativeBooking,
    ),
    captchaWaitlist: asBool(row.captchaWaitlist, DEFAULT_SITE_FORMS.captchaWaitlist),
    captchaShopOrder: asBool(row.captchaShopOrder, DEFAULT_SITE_FORMS.captchaShopOrder),
    captchaPartnerBooking: asBool(
      row.captchaPartnerBooking,
      DEFAULT_SITE_FORMS.captchaPartnerBooking,
    ),
  };
}

export function normalizeSiteEmail(value: unknown): SiteEmailGlobal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_SITE_EMAIL;
  }
  const row = value as Record<string, unknown>;
  return {
    senderName: asString(row.senderName, DEFAULT_SITE_EMAIL.senderName),
    replyToEmail: asString(row.replyToEmail).trim() || undefined,
    footerText: asString(row.footerText, DEFAULT_SITE_EMAIL.footerText),
    leadAlertsEnabled: asBool(row.leadAlertsEnabled, DEFAULT_SITE_EMAIL.leadAlertsEnabled),
    organizerAlertsEnabled: asBool(
      row.organizerAlertsEnabled,
      DEFAULT_SITE_EMAIL.organizerAlertsEnabled,
    ),
    dailyDigestEnabled: asBool(row.dailyDigestEnabled, DEFAULT_SITE_EMAIL.dailyDigestEnabled),
    contentFreshnessAlertsEnabled: asBool(
      row.contentFreshnessAlertsEnabled,
      DEFAULT_SITE_EMAIL.contentFreshnessAlertsEnabled,
    ),
  };
}

export function normalizeSiteMarketing(value: unknown): SiteMarketingGlobal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_SITE_MARKETING;
  }
  const row = value as Record<string, unknown>;
  return {
    announcementEnabled: asBool(
      row.announcementEnabled,
      DEFAULT_SITE_MARKETING.announcementEnabled,
    ),
    announcementText: asString(row.announcementText, DEFAULT_SITE_MARKETING.announcementText),
    announcementCtaLabel: asString(
      row.announcementCtaLabel,
      DEFAULT_SITE_MARKETING.announcementCtaLabel,
    ),
    announcementHref: normalizeNavigationHref(
      row.announcementHref,
      DEFAULT_SITE_MARKETING.announcementHref,
    ),
    announcementTone: asAllowedValue(
      row.announcementTone,
      ["sky", "wine", "neutral"] as const,
      DEFAULT_SITE_MARKETING.announcementTone,
    ),
    announcementOnMobile: asBool(
      row.announcementOnMobile,
      DEFAULT_SITE_MARKETING.announcementOnMobile,
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
    primaryLogoUrl: asString(r.primaryLogoUrl, DEFAULT_SITE_BRANDING.primaryLogoUrl),
    footerLogoUrl: asString(
      r.footerLogoUrl,
      DEFAULT_SITE_BRANDING.footerLogoUrl ?? DEFAULT_SITE_BRANDING.primaryLogoUrl,
    ),
    logoAlt: asString(r.logoAlt, DEFAULT_SITE_BRANDING.logoAlt),
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
    youtubeUrl: asString(r.youtubeUrl).trim() || undefined,
    tiktokUrl: asString(r.tiktokUrl).trim() || undefined,
    facebookUrl: asString(r.facebookUrl).trim() || undefined,
    xUrl: asString(r.xUrl).trim() || undefined,
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

/**
 * Apply the canonical schema before persisting a global setting.
 * This drops unknown browser-supplied fields and coerces every value through
 * the same contract used by the public site.
 */
export function normalizeSiteGlobalByKey<K extends SiteGlobalKey>(
  key: K,
  value: unknown,
): SiteGlobalsMap[K] {
  switch (key) {
    case "site.legal":
      return normalizeSiteLegal(value) as SiteGlobalsMap[K];
    case "site.features":
      return normalizeSiteFeatures(value) as SiteGlobalsMap[K];
    case "site.branding":
      return normalizeSiteBranding(value) as SiteGlobalsMap[K];
    case "site.seo":
      return normalizeSiteSeo(value) as SiteGlobalsMap[K];
    case "site.contact":
      return normalizeSiteContact(value) as SiteGlobalsMap[K];
    case "site.navigation":
      return normalizeSiteNavigation(value) as SiteGlobalsMap[K];
    case "site.design":
      return normalizeSiteDesign(value) as SiteGlobalsMap[K];
    case "site.blog":
      return normalizeSiteBlog(value) as SiteGlobalsMap[K];
    case "site.commerce":
      return normalizeSiteCommerce(value) as SiteGlobalsMap[K];
    case "site.modules":
      return normalizeSiteModules(value) as SiteGlobalsMap[K];
    case "site.forms":
      return normalizeSiteForms(value) as SiteGlobalsMap[K];
    case "site.email":
      return normalizeSiteEmail(value) as SiteGlobalsMap[K];
    case "site.marketing":
      return normalizeSiteMarketing(value) as SiteGlobalsMap[K];
    case "site.maintenance":
      return normalizeSiteMaintenance(value) as SiteGlobalsMap[K];
  }
}
