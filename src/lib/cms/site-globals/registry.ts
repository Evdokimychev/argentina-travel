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
        name: "primaryLogoUrl",
        label: "Основной логотип",
        type: "media",
        required: true,
        hint: "Используется в шапке сайта. Рекомендуется SVG или прозрачный WebP.",
      },
      {
        name: "footerLogoUrl",
        label: "Логотип в подвале",
        type: "media",
        hint: "Если не задан, используется основной логотип.",
      },
      {
        name: "logoAlt",
        label: "Описание логотипа",
        type: "text",
        required: true,
        hint: "Текст для доступности, когда изображение не видно.",
      },
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
        name: "typographyScale",
        label: "Масштаб типографики",
        type: "select",
        options: [
          { label: "Компактный (по умолчанию)", value: "compact" },
          { label: "Сбалансированный", value: "balanced" },
          { label: "Крупный / редакционный", value: "editorial" },
        ],
        hint: "Меняет плотность базового текста. Компактный — спокойнее для глаз на длинных страницах.",
      },
      {
        name: "cornerStyle",
        label: "Скругления интерфейса",
        type: "select",
        options: [
          { label: "Мягкие", value: "soft" },
          { label: "Фирменные", value: "rounded" },
          { label: "Выразительные", value: "expressive" },
        ],
        hint: "Единый безопасный пресет для кнопок, карточек и панелей.",
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
      { name: "showSiteSearch", label: "Показывать поиск по сайту", type: "checkbox" },
      { name: "showThemeToggle", label: "Показывать переключатель темы", type: "checkbox" },
      { name: "showCustomCursor", label: "Фирменный курсор", type: "checkbox" },
      { name: "showScrollToTop", label: "Кнопка «Наверх»", type: "checkbox" },
      {
        name: "showScrollToTopMobile",
        label: "Кнопка «Наверх» на мобильных",
        type: "checkbox",
        hint: "На небольших экранах кнопка может перекрывать контент — включайте после проверки страниц.",
      },
      { name: "showRouteProgress", label: "Индикатор загрузки страниц", type: "checkbox" },
      { name: "showFooterNewsletter", label: "Показывать подписку в футере", type: "checkbox" },
      { name: "showFooterRouteCta", label: "Показывать CTA маршрута в футере", type: "checkbox" },
    ],
  },
  {
    key: "site.navigation",
    label: "Навигация",
    description: "Видимость разделов в главном меню и служебные ссылки. Публикация URL управляется отдельно на экране «Модули».",
    fields: [
      {
        name: "showGeography",
        label: "Показывать в меню «Регионы и места»",
        type: "checkbox",
        hint: "Меняет только навигацию. Доступность страниц, поиска и sitemap настраивается в разделе «Модули».",
      },
      { name: "showDestinations", label: "Показывать регионы в меню", type: "checkbox" },
      { name: "showPlaces", label: "Показывать места, коллекции и маршруты в меню", type: "checkbox" },
      { name: "showTours", label: "Показывать туры в меню", type: "checkbox" },
      { name: "showExcursions", label: "Показывать экскурсии в меню", type: "checkbox" },
      { name: "showGuide", label: "Показывать путеводитель в меню", type: "checkbox" },
      { name: "showGallery", label: "Показывать галерею в меню", type: "checkbox" },
      { name: "showImmigration", label: "Показывать переезд и иммиграцию в меню", type: "checkbox" },
      { name: "showKnowledgeBase", label: "Показывать базу знаний в меню", type: "checkbox" },
      { name: "showForum", label: "Показывать форум в меню", type: "checkbox" },
      { name: "showShop", label: "Показывать магазин в меню", type: "checkbox" },
      { name: "showServices", label: "Показывать сервисы в меню", type: "checkbox" },
      {
        name: "showJournal",
        label: "Показывать блог и журнал в меню",
        type: "checkbox",
        hint: "Скрывает ссылку, но не снимает статьи с публикации. Полное отключение выполняется в разделе «Модули».",
      },
      { name: "showAbout", label: "Показывать раздел о проекте в меню", type: "checkbox" },
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
      { name: "youtubeUrl", label: "YouTube URL", type: "url" },
      { name: "tiktokUrl", label: "TikTok URL", type: "url" },
      { name: "facebookUrl", label: "Facebook URL", type: "url" },
      { name: "xUrl", label: "X / Twitter URL", type: "url" },
      {
        name: "contactPageIntro",
        label: "Текст на странице контактов",
        type: "textarea",
        translatable: true,
      },
    ],
  },
  {
    key: "site.blog",
    label: "Журнал и статьи",
    description: "Состав страницы статьи и количество связанных материалов",
    fields: [
      { name: "showShare", label: "Кнопки «Поделиться»", type: "checkbox" },
      { name: "showComments", label: "Комментарии читателей", type: "checkbox" },
      { name: "showAuthor", label: "Карточка автора", type: "checkbox" },
      { name: "showPrevNext", label: "Предыдущая и следующая статья", type: "checkbox" },
      { name: "showRelatedPosts", label: "Похожие статьи", type: "checkbox" },
      {
        name: "relatedPostsCount",
        label: "Количество похожих статей",
        type: "select",
        options: [
          { label: "3 материала", value: "3" },
          { label: "4 материала", value: "4" },
          { label: "6 материалов", value: "6" },
        ],
      },
      { name: "showNewsletter", label: "Подписка после статьи", type: "checkbox" },
    ],
  },
  {
    key: "site.commerce",
    label: "Магазин и товары",
    description: "Сетка каталога и состав карточки цифрового продукта",
    fields: [
      {
        name: "catalogColumns",
        label: "Колонок в каталоге на компьютере",
        type: "select",
        options: [
          { label: "2 колонки", value: "2" },
          { label: "3 колонки", value: "3" },
          { label: "4 колонки", value: "4" },
        ],
      },
      {
        name: "catalogPageSize",
        label: "Товаров на странице",
        type: "select",
        options: [
          { label: "6 товаров", value: "6" },
          { label: "9 товаров", value: "9" },
          { label: "12 товаров", value: "12" },
        ],
      },
      { name: "showCatalogIntro", label: "Вводный текст каталога", type: "checkbox" },
      { name: "showProductFormat", label: "Формат товара на обложке", type: "checkbox" },
      { name: "showProductPrice", label: "Цена на странице товара", type: "checkbox" },
      { name: "showProductQuestions", label: "Кнопка «Задать вопрос»", type: "checkbox" },
      { name: "showRelatedProducts", label: "Сопутствующие товары", type: "checkbox" },
      {
        name: "relatedProductsCount",
        label: "Количество сопутствующих товаров",
        type: "select",
        options: [
          { label: "2 товара", value: "2" },
          { label: "3 товара", value: "3" },
          { label: "4 товара", value: "4" },
        ],
      },
    ],
  },
  {
    key: "site.modules",
    label: "Модули путешествия",
    description:
      "Апартаменты, аренда авто, трансферы и будущие вертикали. Режим описывает реальный путь клиента и не включает неподготовленный checkout.",
    fields: [
      {
        name: "apartmentsMode",
        label: "Апартаменты",
        type: "select",
        options: [
          { label: "Собственный каталог — запрос подтверждения", value: "native_request" },
          { label: "Подбор по заявке", value: "request" },
          { label: "Готовим собственный каталог", value: "preparing_native" },
          { label: "Отключено", value: "disabled" },
        ],
        hint: "Собственный каталог принимает запрос и честно ожидает подтверждения владельца. Мгновенная оплата не включается.",
      },
      {
        name: "carRentalMode",
        label: "Аренда автомобилей",
        type: "select",
        options: [
          { label: "Партнёр LocalRent", value: "partner" },
          { label: "Партнёр + готовим собственные авто", value: "preparing_hybrid" },
          { label: "Отключено", value: "disabled" },
        ],
        hint: "Собственные автомобили организаторов пока не публикуются: этот режим фиксирует продуктовую стратегию без ложного бронирования.",
      },
      {
        name: "transfersMode",
        label: "Трансферы",
        type: "select",
        options: [
          { label: "Партнёр Intui", value: "partner" },
          { label: "Заявка менеджеру", value: "request" },
          { label: "Партнёр + готовим собственные трансферы", value: "preparing_hybrid" },
          { label: "Отключено", value: "disabled" },
        ],
        hint: "Intui остаётся партнёрским оформлением. Для собственных трансферов отдельно понадобятся перевозчики, машины, маршруты и доступность.",
      },
      {
        name: "hotelsMode",
        label: "Отели",
        type: "select",
        options: [
          { label: "Только в планах", value: "planned" },
          { label: "Не показывать", value: "disabled" },
        ],
        hint: "Отельный модуль пока не разрабатывается и не выдаётся за доступный продукт.",
      },
      {
        name: "showApartmentsInServices",
        label: "Показывать подбор апартаментов на странице сервисов",
        type: "checkbox",
        hint: "Карточка ведёт в существующую форму заявки, без онлайн-оплаты и обещания мгновенного подтверждения.",
      },
      {
        name: "showCarRentalInServices",
        label: "Показывать аренду авто на странице сервисов",
        type: "checkbox",
      },
      {
        name: "showTransfersInServices",
        label: "Показывать трансферы на странице сервисов",
        type: "checkbox",
      },
    ],
  },
  {
    key: "site.marketing",
    label: "Маркетинговое объявление",
    description: "Управляемая промо-панель в верхней части сайта без изменения кода",
    fields: [
      { name: "announcementEnabled", label: "Показывать объявление", type: "checkbox" },
      {
        name: "announcementText",
        label: "Текст объявления",
        type: "text",
        placeholder: "Новые маршруты по Патагонии уже доступны",
      },
      {
        name: "announcementCtaLabel",
        label: "Текст ссылки",
        type: "text",
        placeholder: "Подробнее",
      },
      {
        name: "announcementHref",
        label: "Адрес ссылки",
        type: "text",
        hint: "Только внутренний путь или безопасный HTTPS URL.",
      },
      {
        name: "announcementTone",
        label: "Цветовой характер",
        type: "select",
        options: [
          { label: "Небесный", value: "sky" },
          { label: "Винный", value: "wine" },
          { label: "Нейтральный", value: "neutral" },
        ],
      },
      { name: "announcementOnMobile", label: "Показывать на мобильных", type: "checkbox" },
    ],
  },
  {
    key: "site.forms",
    label: "Формы и защита от спама",
    description:
      "Доступность публичных форм и политика CAPTCHA. Секретный ключ хранится только в защищённом окружении.",
    fields: [
      { name: "contactEnabled", label: "Принимать обращения через контакты", type: "checkbox" },
      { name: "newsletterEnabled", label: "Принимать подписки на рассылку", type: "checkbox" },
      {
        name: "captchaMode",
        label: "Режим CAPTCHA",
        type: "select",
        options: [
          { label: "Выключена", value: "off" },
          { label: "Только выбранные формы", value: "selected" },
          { label: "Все публичные отправки", value: "all_guest_writes" },
        ],
        hint: "Включение разрешается сервером только при настроенных публичном и секретном ключах.",
      },
      { name: "captchaContact", label: "CAPTCHA: контакты", type: "checkbox" },
      { name: "captchaNewsletter", label: "CAPTCHA: подписка", type: "checkbox" },
      { name: "captchaNativeBooking", label: "CAPTCHA: собственное бронирование", type: "checkbox" },
      { name: "captchaWaitlist", label: "CAPTCHA: лист ожидания", type: "checkbox" },
      { name: "captchaShopOrder", label: "CAPTCHA: заказ магазина", type: "checkbox" },
      { name: "captchaPartnerBooking", label: "CAPTCHA: партнёрская заявка", type: "checkbox" },
    ],
  },
  {
    key: "site.email",
    label: "Письма и уведомления",
    description:
      "Безопасные тексты и категории писем. Ключ Resend и доменная проверка управляются вне браузера.",
    fields: [
      { name: "senderName", label: "Имя отправителя", type: "text", required: true },
      { name: "replyToEmail", label: "Email для ответа", type: "email" },
      { name: "footerText", label: "Текст в подвале письма", type: "textarea" },
      { name: "leadAlertsEnabled", label: "Уведомления о новых обращениях", type: "checkbox" },
      { name: "organizerAlertsEnabled", label: "Уведомления организаторам", type: "checkbox" },
      { name: "dailyDigestEnabled", label: "Ежедневная сводка", type: "checkbox" },
      {
        name: "contentFreshnessAlertsEnabled",
        label: "Напоминания об актуальности контента",
        type: "checkbox",
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
  "site.blog",
  "site.commerce",
  "site.modules",
  "site.forms",
  "site.email",
  "site.marketing",
] as const satisfies readonly SiteGlobalKey[];

export const SITE_OPS_GLOBAL_KEYS = ["site.legal", "site.features"] as const satisfies readonly SiteGlobalKey[];

export const SITE_MAINTENANCE_GLOBAL_KEYS = ["site.maintenance"] as const satisfies readonly SiteGlobalKey[];
