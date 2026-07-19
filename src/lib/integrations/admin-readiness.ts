export type IntegrationReadinessStatus =
  | "ready"
  | "partial"
  | "missing"
  | "built_in"
  | "planned";

export type IntegrationReadinessGroup =
  | "platform"
  | "payments"
  | "marketplace"
  | "marketing";

export type IntegrationReadinessItem = {
  id: string;
  label: string;
  group: IntegrationReadinessGroup;
  status: IntegrationReadinessStatus;
  summary: string;
  /** Safe variable names only. Values and secrets are never returned to the browser. */
  missingVariables?: string[];
  href?: string;
};

function hasEnv(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function requiredStatus(required: string[]): Pick<IntegrationReadinessItem, "status" | "missingVariables"> {
  const missingVariables = required.filter((name) => !hasEnv(name));
  if (missingVariables.length === 0) return { status: "ready" };
  if (missingVariables.length < required.length) return { status: "partial", missingVariables };
  return { status: "missing", missingVariables };
}

function item(
  base: Omit<IntegrationReadinessItem, "status" | "missingVariables">,
  required: string[],
): IntegrationReadinessItem {
  return { ...base, ...requiredStatus(required) };
}

export function getIntegrationReadiness(): IntegrationReadinessItem[] {
  const youTravelAuthReady =
    hasEnv("YOUTRAVEL_API_KEY") ||
    (hasEnv("YOUTRAVEL_API_EMAIL") && hasEnv("YOUTRAVEL_API_PASSWORD"));

  return [
    item(
      {
        id: "supabase",
        label: "Supabase",
        group: "platform",
        summary: "База данных, авторизация, хранение контента и служебные операции.",
      },
      ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    ),
    item(
      {
        id: "email",
        label: "Почта и уведомления",
        group: "platform",
        summary: "Отправка системных писем и уведомлений о новых заявках через Resend.",
        href: "/admin/operations",
      },
      ["RESEND_API_KEY", "LEADS_NOTIFY_EMAIL"],
    ),
    item(
      {
        id: "search",
        label: "Поиск Meilisearch",
        group: "platform",
        summary: "Поиск по опубликованным материалам и каталогу.",
      },
      ["MEILISEARCH_HOST", "MEILISEARCH_API_KEY"],
    ),
    item(
      {
        id: "mercadopago",
        label: "Mercado Pago",
        group: "payments",
        summary: "Оплата в Аргентине, подтверждение webhook и возвраты после ручного согласования.",
        href: "/admin/operations/payments",
      },
      ["MERCADOPAGO_ACCESS_TOKEN", "MERCADOPAGO_WEBHOOK_SECRET"],
    ),
    item(
      {
        id: "stripe",
        label: "Stripe",
        group: "payments",
        summary: "Международные карточные платежи и проверка событий Stripe.",
        href: "/admin/operations/payments",
      },
      ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    ),
    item(
      {
        id: "tripster",
        label: "Tripster",
        group: "marketplace",
        summary: "Каталог экскурсий, расписание и доступные партнёрские сценарии бронирования.",
        href: "/admin/marketplace/excursions",
      },
      ["TRIPSTER_PARTNER", "TRIPSTER_SECRET"],
    ),
    item(
      {
        id: "sputnik8",
        label: "Sputnik8",
        group: "marketplace",
        summary: "Партнёрский каталог экскурсий; оформление остаётся на стороне партнёра.",
        href: "/admin/marketplace/excursions",
      },
      ["SPUTNIK8_API_KEY", "SPUTNIK8_USERNAME"],
    ),
    {
      id: "youtravel",
      label: "YouTravel",
      group: "marketplace",
      status: youTravelAuthReady ? (hasEnv("YOUTRAVEL_WEBHOOK_SECRET") ? "ready" : "partial") : "missing",
      summary: "Партнёрские туры, заявки и синхронизация статусов бронирований.",
      missingVariables: [
        ...(youTravelAuthReady ? [] : ["YOUTRAVEL_API_KEY или YOUTRAVEL_API_EMAIL + YOUTRAVEL_API_PASSWORD"]),
        ...(hasEnv("YOUTRAVEL_WEBHOOK_SECRET") ? [] : ["YOUTRAVEL_WEBHOOK_SECRET"]),
      ],
      href: "/admin/marketplace/tours",
    },
    item(
      {
        id: "travelpayouts",
        label: "Travelpayouts",
        group: "marketplace",
        summary: "Атрибуция партнёрских переходов, авиа, страхование и сокращение ссылок.",
      },
      ["TRAVELPAYOUTS_MARKER", "TRAVELPAYOUTS_API_KEY"],
    ),
    item(
      {
        id: "analytics",
        label: "Аналитика",
        group: "marketing",
        summary: "События воронки через GTM/GA4 и Яндекс Метрику с учётом согласия пользователя.",
        href: "/admin/analytics",
      },
      ["NEXT_PUBLIC_GTM_ID", "NEXT_PUBLIC_YANDEX_METRIKA_ID"],
    ),
    item(
      {
        id: "sentry",
        label: "Мониторинг ошибок",
        group: "marketing",
        summary: "Серверные и клиентские ошибки с безопасной диагностикой релизов.",
      },
      ["SENTRY_DSN"],
    ),
    item(
      {
        id: "openai",
        label: "AI-функции",
        group: "marketing",
        summary: "Подбор туров и редакционные помощники. Ключ хранится только на сервере.",
      },
      ["OPENAI_API_KEY"],
    ),
    {
      id: "form-rate-limit",
      label: "Базовая защита форм",
      group: "marketing",
      status: "built_in",
      summary: "Ограничение частоты запросов уже действует для контактов, подписки и заявок организаторов.",
    },
    item(
      {
        id: "captcha",
        label: "CAPTCHA для публичных форм",
        group: "marketing",
        summary:
          "Cloudflare Turnstile защищает выбранные формы; секрет остаётся только в окружении сервера.",
      },
      ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"],
    ),
  ];
}
