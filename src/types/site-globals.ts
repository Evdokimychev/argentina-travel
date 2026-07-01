/** Site globals — Payload Globals pattern mapped to site_settings keys. */

export type SiteGlobalLocaleOverrides<T> = Partial<Record<"en" | "es", Partial<T>>>;

export type SiteLegalTranslatable = Pick<
  { companyName?: string },
  "companyName"
>;

export type SiteLegalGlobal = {
  companyName?: string;
  inn?: string;
  ogrn?: string;
  address?: string;
  supportEmail?: string;
  locales?: SiteGlobalLocaleOverrides<SiteLegalTranslatable>;
};

export type SiteFeaturesGlobal = {
  maintenanceMode: boolean;
  allowOrganizerSignup: boolean;
  /** When true, blog catalog and posts resolve from CMS only (no TS fallback). */
  cmsBlogCutover?: boolean;
  /** When true, guide pages resolve from CMS only (no TS fallback). */
  cmsGuideCutover?: boolean;
  /** When true, destination pages resolve from CMS only (no TS fallback). */
  cmsDestinationCutover?: boolean;
  /** When true, place pages resolve from CMS only (no TS fallback). */
  cmsPlaceCutover?: boolean;
};

export type SiteBrandingTranslatable = Pick<SiteBrandingGlobalBase, "tagline" | "defaultTitle">;

type SiteBrandingGlobalBase = {
  siteName: string;
  tagline: string;
  defaultTitle: string;
  titleTemplate: string;
  defaultOgImage: string;
  themeColor: string;
  /** Favicon path or URL (layout icons.icon). */
  faviconUrl?: string;
  /** Apple touch icon path or URL. */
  appleTouchIconUrl?: string;
};

export type SiteBrandingGlobal = SiteBrandingGlobalBase & {
  locales?: SiteGlobalLocaleOverrides<SiteBrandingTranslatable>;
};

export type SiteSeoTranslatable = Pick<SiteSeoGlobalBase, "defaultDescription">;

type SiteSeoGlobalBase = {
  defaultDescription: string;
  twitterHandle?: string;
  allowIndexing: boolean;
  /** Google Search Console HTML verification token (content value only). */
  googleSiteVerification?: string;
  /** Bing Webmaster Tools msvalidate.01 token. */
  bingSiteVerification?: string;
  /** Ahrefs Webmaster Tools verification token. */
  ahrefsSiteVerification?: string;
  /** Yandex Webmaster / Distribution verification token (content value only). */
  yandexSiteVerification?: string;
};

export type SiteSeoGlobal = SiteSeoGlobalBase & {
  locales?: SiteGlobalLocaleOverrides<SiteSeoTranslatable>;
};

export type SiteContactTranslatable = Pick<SiteContactGlobalBase, "contactPageIntro">;

type SiteContactGlobalBase = {
  supportEmail: string;
  telegramUrl?: string;
  whatsAppUrl?: string;
  instagramUrl?: string;
  contactPageIntro?: string;
};

export type SiteContactGlobal = SiteContactGlobalBase & {
  locales?: SiteGlobalLocaleOverrides<SiteContactTranslatable>;
};

export type SiteMaintenanceTranslatable = Pick<
  SiteMaintenanceGlobalBase,
  "badgeLabel" | "headline" | "message" | "notifyLabel"
>;

type SiteMaintenanceGlobalBase = {
  /** Короткая метка над заголовком, например «Скоро откроемся». */
  badgeLabel: string;
  headline: string;
  message: string;
  /** Подпись над кнопкой связи. */
  notifyLabel: string;
  /** Путь или URL фонового изображения; пусто — hero главной. */
  backgroundImage?: string;
  showContacts: boolean;
  countdownEnabled: boolean;
  /** ISO-дата окончания работ, например 2026-07-15T12:00:00.000Z */
  countdownTarget?: string;
};

export type SiteMaintenanceGlobal = SiteMaintenanceGlobalBase & {
  locales?: SiteGlobalLocaleOverrides<SiteMaintenanceTranslatable>;
};

/** Resolved public shapes — locales stripped after resolveSiteGlobalForLocale. */
export type SiteBrandingGlobalResolved = SiteBrandingGlobalBase;
export type SiteSeoGlobalResolved = SiteSeoGlobalBase;
export type SiteContactGlobalResolved = SiteContactGlobalBase;
export type SiteMaintenanceGlobalResolved = SiteMaintenanceGlobalBase;
export type SiteLegalGlobalResolved = Omit<SiteLegalGlobal, "locales">;

export type SiteGlobalKey =
  | "site.legal"
  | "site.features"
  | "site.branding"
  | "site.seo"
  | "site.contact"
  | "site.maintenance";

export type SiteGlobalsMap = {
  "site.legal": SiteLegalGlobal;
  "site.features": SiteFeaturesGlobal;
  "site.branding": SiteBrandingGlobal;
  "site.seo": SiteSeoGlobal;
  "site.contact": SiteContactGlobal;
  "site.maintenance": SiteMaintenanceGlobal;
};

export const SITE_GLOBAL_KEYS = [
  "site.branding",
  "site.seo",
  "site.contact",
  "site.legal",
  "site.features",
  "site.maintenance",
] as const satisfies readonly SiteGlobalKey[];
