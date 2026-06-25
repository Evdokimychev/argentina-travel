/** Site globals — Payload Globals pattern mapped to site_settings keys. */

export type SiteLegalGlobal = {
  companyName?: string;
  inn?: string;
  ogrn?: string;
  address?: string;
  supportEmail?: string;
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

export type SiteBrandingGlobal = {
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

export type SiteSeoGlobal = {
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

export type SiteContactGlobal = {
  supportEmail: string;
  telegramUrl?: string;
  whatsAppUrl?: string;
  instagramUrl?: string;
  contactPageIntro?: string;
};

export type SiteGlobalKey =
  | "site.legal"
  | "site.features"
  | "site.branding"
  | "site.seo"
  | "site.contact";

export type SiteGlobalsMap = {
  "site.legal": SiteLegalGlobal;
  "site.features": SiteFeaturesGlobal;
  "site.branding": SiteBrandingGlobal;
  "site.seo": SiteSeoGlobal;
  "site.contact": SiteContactGlobal;
};

export const SITE_GLOBAL_KEYS = [
  "site.branding",
  "site.seo",
  "site.contact",
  "site.legal",
  "site.features",
] as const satisfies readonly SiteGlobalKey[];
