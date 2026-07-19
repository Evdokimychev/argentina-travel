import { createSign } from "node:crypto";
import type {
  SearchPerformanceInput,
  SearchVisibilityProvider,
} from "@/lib/seo/search-visibility-types";
import { SearchProviderError } from "@/lib/seo/search-visibility-types";

type FetchLike = typeof fetch;

type GoogleServiceAccount = {
  type: "service_account";
  client_email: string;
  private_key: string;
  token_uri?: string;
};

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function parseGoogleCredential(secret: string): GoogleServiceAccount {
  let parsed: Partial<GoogleServiceAccount>;
  try {
    parsed = JSON.parse(secret) as Partial<GoogleServiceAccount>;
  } catch {
    throw new SearchProviderError(
      "INVALID_CREDENTIAL",
      "Файл Google должен быть JSON-ключом сервисного аккаунта.",
    );
  }
  if (
    parsed.type !== "service_account" ||
    !parsed.client_email?.trim() ||
    !parsed.private_key?.includes("BEGIN PRIVATE KEY")
  ) {
    throw new SearchProviderError(
      "INVALID_CREDENTIAL",
      "В JSON Google не найдены client_email и private_key сервисного аккаунта.",
    );
  }
  if (
    parsed.token_uri &&
    parsed.token_uri.trim() !== "https://oauth2.googleapis.com/token"
  ) {
    throw new SearchProviderError(
      "INVALID_CREDENTIAL",
      "JSON Google содержит неподдерживаемый адрес выдачи токена.",
    );
  }
  return parsed as GoogleServiceAccount;
}

export function describeSearchCredential(
  provider: SearchVisibilityProvider,
  secret: string,
): string {
  if (provider === "google_search_console") {
    return parseGoogleCredential(secret).client_email.trim();
  }
  if (secret.trim().length < 20) {
    throw new SearchProviderError("INVALID_CREDENTIAL", "OAuth-токен Яндекса выглядит неполным.");
  }
  return `OAuth ••••${secret.trim().slice(-4)}`;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new SearchProviderError("INVALID_RESPONSE", "Поисковая система вернула некорректный ответ.");
  }
}

function providerHttpError(status: number): SearchProviderError {
  if (status === 401 || status === 403) {
    return new SearchProviderError(
      "AUTH_FAILED",
      "Поисковая система отклонила доступ. Проверьте токен и права на сайт.",
    );
  }
  if (status === 404) {
    return new SearchProviderError(
      "PROPERTY_NOT_FOUND",
      "Сайт не найден среди подтверждённых ресурсов этого аккаунта.",
    );
  }
  if (status === 429) {
    return new SearchProviderError("RATE_LIMITED", "Лимит запросов временно исчерпан.");
  }
  return new SearchProviderError(
    "PROVIDER_UNAVAILABLE",
    "Поисковая система временно недоступна. Повторите синхронизацию позже.",
  );
}

async function getGoogleAccessToken(
  credential: GoogleServiceAccount,
  fetchImpl: FetchLike,
): Promise<string> {
  const tokenUri = credential.token_uri?.trim() || "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(
    JSON.stringify({
      iss: credential.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${signer.sign(credential.private_key, "base64url")}`;

  const response = await fetchImpl(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw providerHttpError(response.status);
  const payload = (await readJson(response)) as { access_token?: unknown };
  if (typeof payload.access_token !== "string" || !payload.access_token) {
    throw new SearchProviderError("INVALID_RESPONSE", "Google не вернул токен доступа.");
  }
  return payload.access_token;
}

export async function fetchGoogleSearchPerformance(input: {
  propertyUrl: string;
  secret: string;
  dateFrom: string;
  dateTo: string;
  fetchImpl?: FetchLike;
}): Promise<SearchPerformanceInput[]> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const credential = parseGoogleCredential(input.secret);
  const token = await getGoogleAccessToken(credential, fetchImpl);
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    input.propertyUrl,
  )}/searchAnalytics/query`;
  const collected: SearchPerformanceInput[] = [];

  for (let startRow = 0; startRow < 100_000; startRow += 25_000) {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: input.dateFrom,
        endDate: input.dateTo,
        dimensions: ["date", "query", "page", "country", "device"],
        rowLimit: 25_000,
        startRow,
        dataState: "final",
      }),
      cache: "no-store",
    });
    if (!response.ok) throw providerHttpError(response.status);
    const payload = (await readJson(response)) as {
      rows?: Array<{
        keys?: unknown[];
        clicks?: unknown;
        impressions?: unknown;
        ctr?: unknown;
        position?: unknown;
      }>;
    };
    const rows = payload.rows ?? [];
    for (const row of rows) {
      const keys = row.keys ?? [];
      if (keys.length < 5 || keys.some((key) => typeof key !== "string")) continue;
      collected.push({
        provider: "google_search_console",
        propertyUrl: input.propertyUrl,
        metricDate: String(keys[0]),
        query: String(keys[1]),
        page: String(keys[2]),
        country: String(keys[3]),
        device: String(keys[4]),
        clicks: Number(row.clicks) || 0,
        impressions: Number(row.impressions) || 0,
        ctr: Number(row.ctr) || 0,
        position: Number(row.position) || 0,
      });
    }
    if (rows.length < 25_000) break;
  }
  return collected;
}

function comparableHost(value: string): string {
  try {
    return new URL(value.replace(/^sc-domain:/, "https://")).hostname.replace(/^www\./, "");
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  }
}

export async function fetchYandexSearchPerformance(input: {
  propertyUrl: string;
  secret: string;
  fetchImpl?: FetchLike;
}): Promise<SearchPerformanceInput[]> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const headers = { Authorization: `OAuth ${input.secret.trim()}`, Accept: "application/json" };
  const userResponse = await fetchImpl("https://api.webmaster.yandex.net/v4/user", {
    headers,
    cache: "no-store",
  });
  if (!userResponse.ok) throw providerHttpError(userResponse.status);
  const userPayload = (await readJson(userResponse)) as { user_id?: unknown };
  const userId = String(userPayload.user_id ?? "");
  if (!userId) throw new SearchProviderError("INVALID_RESPONSE", "Яндекс не вернул ID пользователя.");

  const hostsResponse = await fetchImpl(
    `https://api.webmaster.yandex.net/v4/user/${encodeURIComponent(userId)}/hosts`,
    { headers, cache: "no-store" },
  );
  if (!hostsResponse.ok) throw providerHttpError(hostsResponse.status);
  const hostsPayload = (await readJson(hostsResponse)) as {
    hosts?: Array<{
      host_id?: unknown;
      ascii_host_url?: unknown;
      unicode_host_url?: unknown;
      verified?: unknown;
    }>;
  };
  const expectedHost = comparableHost(input.propertyUrl);
  const host = (hostsPayload.hosts ?? []).find((candidate) => {
    const url = String(candidate.ascii_host_url ?? candidate.unicode_host_url ?? "");
    return comparableHost(url) === expectedHost;
  });
  const hostId = String(host?.host_id ?? "");
  if (!hostId) throw new SearchProviderError("PROPERTY_NOT_FOUND", "Сайт не найден в Яндекс.Вебмастере.");

  const collected: SearchPerformanceInput[] = [];
  for (let offset = 0; offset < 3_000; offset += 500) {
    const params = new URLSearchParams({
      order_by: "TOTAL_SHOWS",
      limit: "500",
      offset: String(offset),
    });
    for (const indicator of ["TOTAL_SHOWS", "TOTAL_CLICKS", "AVG_SHOW_POSITION", "AVG_CLICK_POSITION"]) {
      params.append("query_indicator", indicator);
    }
    const queryResponse = await fetchImpl(
      `https://api.webmaster.yandex.net/v4/user/${encodeURIComponent(userId)}/hosts/${encodeURIComponent(
        hostId,
      )}/search-queries/popular?${params.toString()}`,
      { headers, cache: "no-store" },
    );
    if (!queryResponse.ok) throw providerHttpError(queryResponse.status);
    const queryPayload = (await readJson(queryResponse)) as {
      date_to?: unknown;
      queries?: Array<{ query_text?: unknown; indicators?: Record<string, unknown> }>;
    };
    const queryRows = queryPayload.queries ?? [];
    const metricDate = String(queryPayload.date_to ?? new Date().toISOString().slice(0, 10)).slice(0, 10);
    for (const row of queryRows) {
      const query = typeof row.query_text === "string" ? row.query_text.trim() : "";
      if (!query) continue;
      const indicators = row.indicators ?? {};
      const impressions = Number(indicators.TOTAL_SHOWS) || 0;
      const clicks = Number(indicators.TOTAL_CLICKS) || 0;
      collected.push({
        provider: "yandex_webmaster",
        propertyUrl: input.propertyUrl,
        metricDate,
        query,
        page: "",
        country: "",
        device: "all",
        clicks,
        impressions,
        ctr: impressions > 0 ? clicks / impressions : 0,
        position: Number(indicators.AVG_SHOW_POSITION) || 0,
      });
    }
    if (queryRows.length < 500) break;
  }
  return collected;
}
