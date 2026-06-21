import type {
  SiteBrandingGlobal,
  SiteContactGlobal,
  SiteFeaturesGlobal,
  SiteLegalGlobal,
  SiteSeoGlobal,
} from "@/types/site-globals";

export const DEFAULT_SITE_BRANDING: SiteBrandingGlobal = {
  siteName: "Пора в Аргентину",
  tagline: "путешествия по Аргентине",
  defaultTitle: "Пора в Аргентину — путешествия по Аргентине",
  titleTemplate: "%s | Пора в Аргентину",
  defaultOgImage: "/logo-light.svg",
  themeColor: "#74acdf",
};

export const DEFAULT_SITE_SEO: SiteSeoGlobal = {
  defaultDescription:
    "Авторские туры и экскурсии по Аргентине: Патагония, Буэнос-Айрес, Мендоса, Игуасу. Русскоязычные гиды и организаторы.",
  twitterHandle: "",
  allowIndexing: true,
};

export const DEFAULT_SITE_CONTACT: SiteContactGlobal = {
  supportEmail: "hello@goargentina.ru",
  telegramUrl: "",
  whatsAppUrl: "",
  instagramUrl: "",
  contactPageIntro: "",
};

export const DEFAULT_SITE_FEATURES: SiteFeaturesGlobal = {
  maintenanceMode: false,
  allowOrganizerSignup: true,
};

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
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
  };
}

export function normalizeSiteContact(value: unknown): SiteContactGlobal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_SITE_CONTACT;
  }
  const r = value as Record<string, unknown>;
  return {
    supportEmail: asString(r.supportEmail, DEFAULT_SITE_CONTACT.supportEmail),
    telegramUrl: asString(r.telegramUrl) || undefined,
    whatsAppUrl: asString(r.whatsAppUrl) || undefined,
    instagramUrl: asString(r.instagramUrl) || undefined,
    contactPageIntro: asString(r.contactPageIntro) || undefined,
  };
}

/** Strip empty optional strings before save. */
export function sanitizeGlobalForSave<T extends Record<string, unknown>>(value: T): T {
  const out = { ...value };
  for (const [key, val] of Object.entries(out)) {
    if (typeof val === "string" && val.trim() === "" && key !== "siteName" && key !== "supportEmail") {
      delete out[key as keyof T];
    }
  }
  return out;
}
