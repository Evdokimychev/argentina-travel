import type { SiteGlobalKey } from "@/types/site-globals";

export type SiteGlobalFieldType =
  | "text"
  | "email"
  | "url"
  | "textarea"
  | "checkbox"
  | "select"
  | "color"
  | "media";

export type SiteGlobalFieldDef = {
  name: string;
  label: string;
  type: SiteGlobalFieldType;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  options?: ReadonlyArray<{ label: string; value: string }>;
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
      {
        name: "themeColor",
        label: "Цвет интерфейса браузера",
        type: "color",
        hint: "Используется в метаданных и оформлении браузера. Палитра сайта выбирается в разделе «Дизайн».",
      },
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
    key: "site.design",
    label: "Дизайн",
    description: "Предустановленная палитра, типографика и состав глобальных элементов сайта",
    fields: [
      {
        name: "palettePreset",
        label: "Палитра сайта",
        type: "select",
        options: [
          { label: "Аргентина", value: "argentina" },
          { label: "Патагония", value: "patagonia" },
          { label: "Вино", value: "wine" },
        ],
        hint: "Только проверенные палитры дизайн-системы; произвольный HEX здесь не используется.",
      },
      {
        name: "headingFont",
        label: "Шрифт заголовков",
        type: "select",
        options: [
          { label: "Unbounded", value: "unbounded" },
          { label: "Антиква", value: "serif" },
          { label: "Системный", value: "system" },
        ],
      },
      {
        name: "headerVariant",
        label: "Вариант шапки",
        type: "select",
        options: [
          { label: "Воздушная", value: "floating" },
          { label: "Компактная", value: "compact" },
        ],
      },
      {
        name: "footerVariant",
        label: "Вариант футера",
        type: "select",
        options: [
          { label: "Светлый", value: "light" },
          { label: "Дымка", value: "mist" },
        ],
      },
      { name: "showUtilityBar", label: "Показывать служебную панель", type: "checkbox" },
      { name: "showHeaderMapButton", label: "Показывать кнопку карты в шапке", type: "checkbox" },
      { name: "showThemeToggle", label: "Показывать переключатель темы", type: "checkbox" },
      { name: "showFooterNewsletter", label: "Показывать подписку в футере", type: "checkbox" },
      { name: "showFooterRouteCta", label: "Показывать CTA маршрута в футере", type: "checkbox" },
    ],
  },
  {
    key: "site.navigation",
    label: "Навигация",
    description: "Разделы главного меню и служебные ссылки в верхней панели",
    fields: [
      { name: "showGeography", label: "Показывать направления", type: "checkbox" },
      { name: "showTours", label: "Показывать туры", type: "checkbox" },
      { name: "showExcursions", label: "Показывать экскурсии", type: "checkbox" },
      { name: "showGuide", label: "Показывать путеводитель", type: "checkbox" },
      { name: "showGallery", label: "Показывать галерею", type: "checkbox" },
      { name: "showImmigration", label: "Показывать иммиграцию", type: "checkbox" },
      { name: "showKnowledgeBase", label: "Показывать базу знаний", type: "checkbox" },
      { name: "showShop", label: "Показывать магазин", type: "checkbox" },
      { name: "showServices", label: "Показывать сервисы", type: "checkbox" },
      { name: "showJournal", label: "Показывать журнал", type: "checkbox" },
      { name: "showAbout", label: "Показывать раздел о проекте", type: "checkbox" },
      { name: "utilityToursLabel", label: "Ссылка на туры: текст", type: "text" },
      { name: "utilityToursUrl", label: "Ссылка на туры: адрес", type: "text" },
      { name: "utilityOrganizerLabel", label: "Ссылка для организаторов: текст", type: "text" },
      { name: "utilityOrganizerUrl", label: "Ссылка для организаторов: адрес", type: "text" },
      { name: "utilityContactLabel", label: "Ссылка контактов: текст", type: "text" },
      { name: "utilityContactUrl", label: "Ссылка контактов: адрес", type: "text" },
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
  "site.navigation",
  "site.design",
] as const satisfies readonly SiteGlobalKey[];

export const SITE_OPS_GLOBAL_KEYS = ["site.legal", "site.features"] as const satisfies readonly SiteGlobalKey[];

export const SITE_MAINTENANCE_GLOBAL_KEYS = ["site.maintenance"] as const satisfies readonly SiteGlobalKey[];
