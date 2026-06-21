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
};

export type SiteBrandingGlobal = {
  siteName: string;
  tagline: string;
  defaultTitle: string;
  titleTemplate: string;
  defaultOgImage: string;
  themeColor: string;
};

export type SiteSeoGlobal = {
  defaultDescription: string;
  twitterHandle?: string;
  allowIndexing: boolean;
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
