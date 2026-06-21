import type { SiteGlobalKey } from "@/types/site-globals";

export type SiteGlobalFieldType =
  | "text"
  | "email"
  | "url"
  | "textarea"
  | "checkbox"
  | "color";

export type SiteGlobalFieldDef = {
  name: string;
  label: string;
  type: SiteGlobalFieldType;
  placeholder?: string;
  hint?: string;
  required?: boolean;
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
      { name: "tagline", label: "Слоган", type: "text", placeholder: "путешествия по Аргентине" },
      {
        name: "defaultTitle",
        label: "Title по умолчанию",
        type: "text",
        hint: "Когда у страницы нет своего title",
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
        label: "OG image (путь или URL)",
        type: "text",
        placeholder: "/media/...",
      },
      { name: "themeColor", label: "Theme color", type: "color" },
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
      },
    ],
  },
  {
    key: "site.legal",
    label: "Юридическая информация",
    description: "Реквизиты в footer и legal-страницах",
    fields: [
      { name: "companyName", label: "Название организации", type: "text" },
      { name: "inn", label: "ИНН", type: "text" },
      { name: "ogrn", label: "ОГРН", type: "text" },
      { name: "address", label: "Адрес", type: "textarea" },
      { name: "supportEmail", label: "Email (юридический)", type: "email" },
    ],
  },
  {
    key: "site.features",
    label: "Функции",
    description: "Feature flags и режим обслуживания",
    fields: [
      { name: "maintenanceMode", label: "Режим обслуживания", type: "checkbox" },
      { name: "allowOrganizerSignup", label: "Заявки организаторов", type: "checkbox" },
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
