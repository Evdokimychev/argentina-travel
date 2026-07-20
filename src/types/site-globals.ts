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
  /** Main public logo used in the site header. */
  primaryLogoUrl: string;
  /** Optional footer logo; falls back to primaryLogoUrl. */
  footerLogoUrl?: string;
  /** Accessible label for uploaded logo variants. */
  logoAlt: string;
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
  youtubeUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  xUrl?: string;
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

export type SiteNavigationGlobal = {
  showGeography: boolean;
  showDestinations: boolean;
  showPlaces: boolean;
  showTours: boolean;
  showExcursions: boolean;
  showGuide: boolean;
  showGallery: boolean;
  showImmigration: boolean;
  showKnowledgeBase: boolean;
  showForum: boolean;
  showShop: boolean;
  showServices: boolean;
  showJournal: boolean;
  showAbout: boolean;
  utilityToursLabel: string;
  utilityToursUrl: string;
  utilityOrganizerLabel: string;
  utilityOrganizerUrl: string;
  utilityContactLabel: string;
  utilityContactUrl: string;
};

export type SiteDesignGlobal = {
  palettePreset: "argentina" | "patagonia" | "wine";
  headingFont: "unbounded" | "serif" | "system";
  typographyScale: "compact" | "balanced" | "editorial";
  cornerStyle: "soft" | "rounded" | "expressive";
  headerVariant: "floating" | "compact";
  footerVariant: "light" | "mist";
  showUtilityBar: boolean;
  showHeaderMapButton: boolean;
  showSiteSearch: boolean;
  showThemeToggle: boolean;
  showCustomCursor: boolean;
  showScrollToTop: boolean;
  showScrollToTopMobile: boolean;
  showRouteProgress: boolean;
  showFooterNewsletter: boolean;
  showFooterRouteCta: boolean;
};

export type SiteBlogGlobal = {
  showShare: boolean;
  showComments: boolean;
  showAuthor: boolean;
  showRelatedPosts: boolean;
  showPrevNext: boolean;
  showNewsletter: boolean;
  relatedPostsCount: "3" | "4" | "6";
};

export type SiteCommerceGlobal = {
  catalogColumns: "2" | "3" | "4";
  catalogPageSize: "6" | "9" | "12";
  showCatalogIntro: boolean;
  showProductFormat: boolean;
  showProductPrice: boolean;
  showProductQuestions: boolean;
  showRelatedProducts: boolean;
  relatedProductsCount: "2" | "3" | "4";
};

export type SiteFormsGlobal = {
  contactEnabled: boolean;
  newsletterEnabled: boolean;
  captchaMode: "off" | "selected" | "all_guest_writes";
  captchaContact: boolean;
  captchaNewsletter: boolean;
  captchaNativeBooking: boolean;
  captchaWaitlist: boolean;
  captchaShopOrder: boolean;
  captchaPartnerBooking: boolean;
};

export type SiteEmailGlobal = {
  senderName: string;
  replyToEmail?: string;
  footerText: string;
  leadAlertsEnabled: boolean;
  organizerAlertsEnabled: boolean;
  dailyDigestEnabled: boolean;
  contentFreshnessAlertsEnabled: boolean;
};

export type SiteMarketingGlobal = {
  announcementEnabled: boolean;
  announcementText: string;
  announcementCtaLabel: string;
  announcementHref: string;
  announcementTone: "sky" | "wine" | "neutral";
  announcementOnMobile: boolean;
};

export type ApartmentsModuleMode = "disabled" | "request" | "preparing_native" | "native_request";
export type CarRentalModuleMode = "disabled" | "partner" | "preparing_hybrid";
export type TransfersModuleMode = "disabled" | "request" | "partner" | "preparing_hybrid";
export type HotelsModuleMode = "disabled" | "planned";

export const SITE_PUBLIC_MODULE_IDS = [
  "geography",
  "destinations",
  "places",
  "tours",
  "excursions",
  "guide",
  "gallery",
  "immigration",
  "knowledgeBase",
  "forum",
  "shop",
  "services",
  "journal",
  "about",
] as const;

export type SitePublicModuleId = (typeof SITE_PUBLIC_MODULE_IDS)[number];

/**
 * Public lifecycle state. Navigation visibility intentionally lives in
 * SiteNavigationGlobal so owners can hide a menu item without unpublishing a
 * working page. Keeping these concepts separate prevents a visible link from
 * being mistaken for route availability.
 */
export type SitePublicModuleState = {
  activated: boolean;
  published: boolean;
  includeInSearch: boolean;
  includeInSitemap: boolean;
};

/**
 * Product strategy for travel verticals beyond tours and excursions.
 * These values describe supported public entry points and the next safe product stage.
 * They never grant organizer permissions or enable a checkout by themselves.
 */
export type SiteModulesGlobal = {
  apartmentsMode: ApartmentsModuleMode;
  carRentalMode: CarRentalModuleMode;
  transfersMode: TransfersModuleMode;
  hotelsMode: HotelsModuleMode;
  showApartmentsInServices: boolean;
  showCarRentalInServices: boolean;
  showTransfersInServices: boolean;
  publicModules: Record<SitePublicModuleId, SitePublicModuleState>;
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
  | "site.navigation"
  | "site.design"
  | "site.blog"
  | "site.commerce"
  | "site.modules"
  | "site.forms"
  | "site.email"
  | "site.marketing"
  | "site.maintenance";

export type SiteGlobalsMap = {
  "site.legal": SiteLegalGlobal;
  "site.features": SiteFeaturesGlobal;
  "site.branding": SiteBrandingGlobal;
  "site.seo": SiteSeoGlobal;
  "site.contact": SiteContactGlobal;
  "site.navigation": SiteNavigationGlobal;
  "site.design": SiteDesignGlobal;
  "site.blog": SiteBlogGlobal;
  "site.commerce": SiteCommerceGlobal;
  "site.modules": SiteModulesGlobal;
  "site.forms": SiteFormsGlobal;
  "site.email": SiteEmailGlobal;
  "site.marketing": SiteMarketingGlobal;
  "site.maintenance": SiteMaintenanceGlobal;
};

export const SITE_GLOBAL_KEYS = [
  "site.branding",
  "site.seo",
  "site.contact",
  "site.navigation",
  "site.design",
  "site.blog",
  "site.commerce",
  "site.modules",
  "site.forms",
  "site.email",
  "site.marketing",
  "site.legal",
  "site.features",
  "site.maintenance",
] as const satisfies readonly SiteGlobalKey[];
