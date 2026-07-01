import type { SiteGlobalKey } from "@/types/site-globals";

export type SiteGlobalFieldType =
  | "text"
  | "email"
  | "url"
  | "textarea"
  | "checkbox"
  | "color"
  | "media";

export type SiteGlobalFieldDef = {
  name: string;
  label: string;
  type: SiteGlobalFieldType;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  /** When true, field supports RU base + locales.en/es overrides. */
  translatable?: boolean;
};

export type SiteGlobalDefinition = {
  key: SiteGlobalKey;
  label: string;
  description: string;
  fields: SiteGlobalFieldDef[];
};

/** Field schemas — aligned with Payload CMS globals tabs. */
export const SITE_GLOBAL_DEFINITIONS: SiteGlobalDefinition[] = [
  {
    key: "site.branding",
    label: "Бренд",
    description: "Название, слоган и базовые OG-настройки сайта",
    fields: [
      { name: "siteName", label: "Название сайта", type: "text", required: true },
      { name: "tagline", label: "Слоган", type: "text", placeholder: "путешествия по Аргентине", translatable: true },
      {
        name: "defaultTitle",
        label: "Title по умолчанию",
        type: "text",
        hint: "Когда у страницы нет своего title",
        translatable: true,
      },
      {
        name: "titleTemplate",
        label: "Шаблон title",
        type: "text",
        placeholder: "%s | Пора в Аргентину",
        hint: "%s — заголовок страницы",
      },
      {
        name: "defaultOgImage",
        label: "OG image",
        type: "media",
        hint: "Изображение по умолчанию для Open Graph",
      },
      { name: "themeColor", label: "Theme color", type: "color" },
      {
        name: "faviconUrl",
        label: "Favicon",
        type: "media",
        hint: "Иконка вкладки браузера",
      },
      {
        name: "appleTouchIconUrl",
        label: "Apple touch icon",
        type: "media",
        hint: "Иконка для «Добавить на экран»",
      },
    ],
  },
  {
    key: "site.seo",
    label: "SEO по умолчанию",
    description: "Глобальные meta для layout и fallback CMS",
    fields: [
      {
        name: "defaultDescription",
        label: "Meta description",
        type: "textarea",
        required: true,
        translatable: true,
      },
      {
        name: "twitterHandle",
        label: "Twitter / X (@handle)",
        type: "text",
        placeholder: "@goargentina",
      },
      {
        name: "allowIndexing",
        label: "Разрешить индексацию (robots)",
        type: "checkbox",
      },
      {
        name: "googleSiteVerification",
        label: "Google Search Console (verification token)",
        type: "text",
        hint: "Значение content из meta google-site-verification",
      },
      {
        name: "bingSiteVerification",
        label: "Bing Webmaster (msvalidate.01)",
        type: "text",
      },
      {
        name: "ahrefsSiteVerification",
        label: "Ahrefs Webmaster Tools",
        type: "text",
        hint: "Значение content из meta ahrefs-site-verification",
      },
      {
        name: "yandexSiteVerification",
        label: "Yandex Webmaster / Дистрибуция (verification token)",
        type: "text",
        hint: "Значение content из meta yandex-verification или код партнёрской верификации",
      },
    ],
  },
  {
    key: "site.contact",
    label: "Контакты",
    description: "Email и соцсети в footer и на /contacts",
    fields: [
      { name: "supportEmail", label: "Email поддержки", type: "email", required: true },
      { name: "telegramUrl", label: "Telegram URL", type: "url", placeholder: "https://t.me/..." },
      { name: "whatsAppUrl", label: "WhatsApp URL", type: "url" },
      { name: "instagramUrl", label: "Instagram URL", type: "url" },
      {
        name: "contactPageIntro",
        label: "Текст на странице контактов",
        type: "textarea",
        translatable: true,
      },
    ],
  },
  {
    key: "site.legal",
    label: "Юридическая информация",
    description: "Реквизиты в footer и legal-страницах",
    fields: [
      { name: "companyName", label: "Название организации", type: "text", translatable: true },
      { name: "inn", label: "ИНН", type: "text" },
      { name: "ogrn", label: "ОГРН", type: "text" },
      { name: "address", label: "Адрес", type: "textarea" },
      { name: "supportEmail", label: "Email (юридический)", type: "email" },
    ],
  },
  {
    key: "site.maintenance",
    label: "Заглушка при работах",
    description: "Полноэкранная страница /maintenance при включённом режиме обслуживания",
    fields: [
      { name: "badgeLabel", label: "Метка над заголовком", type: "text", placeholder: "Скоро откроемся", translatable: true },
      { name: "headline", label: "Заголовок", type: "text", required: true, translatable: true },
      { name: "message", label: "Описание", type: "textarea", translatable: true },
      { name: "notifyLabel", label: "Подпись над кнопкой связи", type: "text", translatable: true },
      {
        name: "backgroundImage",
        label: "Фоновое изображение",
        type: "media",
        hint: "Пусто — hero главной страницы",
      },
      { name: "showContacts", label: "Показывать контакты внизу", type: "checkbox" },
      { name: "countdownEnabled", label: "Показывать обратный отсчёт", type: "checkbox" },
      {
        name: "countdownTarget",
        label: "Дата окончания работ (ISO)",
        type: "text",
        placeholder: "2026-07-15T12:00:00.000Z",
        hint: "UTC или локальное время в формате ISO",
      },
    ],
  },
  {
    key: "site.features",
    label: "Функции",
    description: "Feature flags и режим обслуживания",
    fields: [
      { name: "maintenanceMode", label: "Режим обслуживания", type: "checkbox" },
      { name: "allowOrganizerSignup", label: "Заявки организаторов", type: "checkbox" },
      {
        name: "cmsBlogCutover",
        label: "CMS-only: блог",
        type: "checkbox",
        hint: "Без fallback на TS — только опубликованные content_documents",
      },
      {
        name: "cmsGuideCutover",
        label: "CMS-only: путеводитель",
        type: "checkbox",
        hint: "Статьи /guide/* из CMS; топики TS остаются",
      },
      {
        name: "cmsDestinationCutover",
        label: "CMS-only: направления",
        type: "checkbox",
        hint: "Страницы /destinations/* только из CMS",
      },
      {
        name: "cmsPlaceCutover",
        label: "CMS-only: места",
        type: "checkbox",
        hint: "Страницы /places/* только из CMS",
      },
    ],
  },
];

export const SITE_GLOBAL_BY_KEY = Object.fromEntries(
  SITE_GLOBAL_DEFINITIONS.map((def) => [def.key, def])
) as Record<SiteGlobalKey, SiteGlobalDefinition>;

export const SITE_CONTENT_GLOBAL_KEYS = [
  "site.branding",
  "site.seo",
  "site.contact",
] as const satisfies readonly SiteGlobalKey[];

export const SITE_OPS_GLOBAL_KEYS = ["site.legal", "site.features"] as const satisfies readonly SiteGlobalKey[];

export const SITE_MAINTENANCE_GLOBAL_KEYS = ["site.maintenance"] as const satisfies readonly SiteGlobalKey[];
