import "server-only";

import { getIntegrationReadiness } from "@/lib/integrations/admin-readiness";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTripsterAccessToken } from "@/lib/tripster/auth";
import { fetchYouTravelTours } from "@/lib/youtravel/client";

export const INTEGRATION_VERIFICATION_IDS = [
  "supabase",
  "email",
  "search",
  "mercadopago",
  "stripe",
  "tripster",
  "sputnik8",
  "youtravel",
  "travelpayouts",
  "analytics",
  "sentry",
  "openai",
  "form-rate-limit",
  "captcha",
] as const;

export type IntegrationVerificationId = (typeof INTEGRATION_VERIFICATION_IDS)[number];
export type IntegrationVerificationStatus =
  | "verified"
  | "failed"
  | "manual_required"
  | "not_configured";

export type IntegrationVerificationResult = {
  id: IntegrationVerificationId;
  status: IntegrationVerificationStatus;
  checkedAt: string;
  latencyMs: number;
  summary: string;
};

type VerificationDependencies = {
  fetcher: typeof fetch;
  verifySupabase: () => Promise<void>;
  verifyTripster: () => Promise<void>;
  verifyYouTravel: () => Promise<void>;
  now: () => number;
};

const MANUAL_SUMMARIES: Partial<Record<IntegrationVerificationId, string>> = {
  email: "Отправьте тестовое письмо владельцу через служебную очередь: read-only метод Resend не подтверждает право отправки с выбранного домена.",
  sputnik8: "Каталог работает из синхронизированной копии. Проверьте свежесть последней синхронизации и контрольный партнёрский переход.",
  travelpayouts: "Проверка должна включать контрольный партнёрский переход: тест API без создания ссылки не подтверждает атрибуцию.",
  analytics: "Откройте тестовый визит в режиме отладки GTM/GA4 и убедитесь, что событие принято после согласия пользователя.",
  sentry: "Отправьте защищённое тестовое событие из центра операций и подтвердите его появление в Sentry.",
  captcha: "Выполните контрольную отправку публичной формы: Turnstile проверяет не ключ отдельно, а одноразовый токен браузера.",
};

function isVerificationId(value: string): value is IntegrationVerificationId {
  return (INTEGRATION_VERIFICATION_IDS as readonly string[]).includes(value);
}

function configured(id: IntegrationVerificationId): boolean {
  const item = getIntegrationReadiness().find((entry) => entry.id === id);
  return item?.status === "configured" || item?.status === "ready" || item?.status === "built_in";
}

async function expectOk(response: Response): Promise<void> {
  if (!response.ok) {
    throw new Error(`HTTP_${Math.floor(response.status / 100)}XX`);
  }
}

function safeBaseUrl(value: string | undefined): string {
  const url = new URL(value?.trim() ?? "");
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("INVALID_URL");
  return url.toString().replace(/\/$/, "");
}

async function verifyHttpIntegration(
  id: IntegrationVerificationId,
  fetcher: typeof fetch,
): Promise<void> {
  const common = { cache: "no-store" as const, signal: AbortSignal.timeout(8_000) };
  switch (id) {
    case "search":
      await expectOk(await fetcher(`${safeBaseUrl(process.env.MEILISEARCH_HOST)}/health`, {
        ...common,
        headers: { Authorization: `Bearer ${process.env.MEILISEARCH_API_KEY?.trim() ?? ""}` },
      }));
      return;
    case "mercadopago":
      await expectOk(await fetcher("https://api.mercadopago.com/users/me", {
        ...common,
        headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() ?? ""}` },
      }));
      return;
    case "stripe": {
      const token = Buffer.from(`${process.env.STRIPE_SECRET_KEY?.trim() ?? ""}:`).toString("base64");
      await expectOk(await fetcher("https://api.stripe.com/v1/balance", {
        ...common,
        headers: { Authorization: `Basic ${token}` },
      }));
      return;
    }
    case "openai":
      await expectOk(await fetcher("https://api.openai.com/v1/models", {
        ...common,
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY?.trim() ?? ""}` },
      }));
      return;
    default:
      throw new Error("UNSUPPORTED_PROBE");
  }
}

const DEFAULT_DEPENDENCIES: VerificationDependencies = {
  fetcher: fetch,
  now: Date.now,
  async verifySupabase() {
    const { error } = await createSupabaseAdminClient().from("site_settings").select("key").limit(1);
    if (error) throw new Error("SUPABASE_QUERY_FAILED");
  },
  async verifyTripster() {
    await getTripsterAccessToken(true);
  },
  async verifyYouTravel() {
    await fetchYouTravelTours({ take: 1, skip: 0 });
  },
};

export async function verifyIntegrationConnection(
  rawId: string,
  dependencies: VerificationDependencies = DEFAULT_DEPENDENCIES,
): Promise<IntegrationVerificationResult> {
  if (!isVerificationId(rawId)) throw new Error("UNKNOWN_INTEGRATION");
  const id = rawId;
  const startedAt = dependencies.now();
  const checkedAt = new Date(startedAt).toISOString();

  if (!configured(id)) {
    return {
      id,
      status: "not_configured",
      checkedAt,
      latencyMs: 0,
      summary: "Сначала добавьте обязательные ключи в защищённое окружение проекта.",
    };
  }

  if (id === "form-rate-limit") {
    return {
      id,
      status: "verified",
      checkedAt,
      latencyMs: 0,
      summary: "Встроенная защита форм включена и не зависит от внешнего сервиса.",
    };
  }

  const manualSummary = MANUAL_SUMMARIES[id];
  if (manualSummary) {
    return { id, status: "manual_required", checkedAt, latencyMs: 0, summary: manualSummary };
  }

  try {
    if (id === "supabase") await dependencies.verifySupabase();
    else if (id === "tripster") await dependencies.verifyTripster();
    else if (id === "youtravel") await dependencies.verifyYouTravel();
    else await verifyHttpIntegration(id, dependencies.fetcher);
    return {
      id,
      status: "verified",
      checkedAt,
      latencyMs: Math.max(0, dependencies.now() - startedAt),
      summary: "Read-only проверка соединения прошла успешно.",
    };
  } catch (error) {
    const reason = error instanceof Error && /^HTTP_[45]XX$/.test(error.message)
      ? ` Провайдер ответил ${error.message.slice(5).replace("XX", "xx")}.`
      : "";
    return {
      id,
      status: "failed",
      checkedAt,
      latencyMs: Math.max(0, dependencies.now() - startedAt),
      summary: `Соединение не подтверждено.${reason} Проверьте ключи и журнал сервиса.`,
    };
  }
}
