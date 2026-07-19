import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  fetchGoogleSearchPerformance,
  fetchYandexSearchPerformance,
} from "@/lib/seo/search-provider-clients";
import type {
  SearchOpportunity,
  SearchPerformanceInput,
  SearchProviderConnection,
  SearchVisibilityProvider,
  SearchVisibilitySnapshot,
} from "@/lib/seo/search-visibility-types";
import { SearchProviderError } from "@/lib/seo/search-visibility-types";

type SummaryMetric = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type SummaryPayload = {
  from?: unknown;
  to?: unknown;
  totals?: Partial<SummaryMetric>;
  queries?: Array<Partial<SummaryMetric> & { query?: unknown }>;
  pages?: Array<Partial<SummaryMetric> & { page?: unknown }>;
};

function actorUuid(actorId: string): string | null {
  return actorId === "service-role" ? null : actorId;
}

function safeNumber(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function cleanErrorCode(error: unknown): string {
  if (error instanceof SearchProviderError) return error.code;
  return "SYNC_FAILED";
}

function userFacingError(error: unknown): string {
  if (error instanceof SearchProviderError) return error.message;
  return "Не удалось синхронизировать поисковые данные. Повторите позже.";
}

function dateDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function normalizeConnection(row: {
  provider: SearchVisibilityProvider;
  property_url: string;
  credential_label: string | null;
  status: "configured" | "verified" | "error";
  last_verified_at: string | null;
  last_synced_at: string | null;
  last_error_code: string | null;
}): SearchProviderConnection {
  return {
    provider: row.provider,
    propertyUrl: row.property_url,
    credentialLabel: row.credential_label,
    status: row.status,
    lastVerifiedAt: row.last_verified_at,
    lastSyncedAt: row.last_synced_at,
    lastErrorCode: row.last_error_code,
  };
}

function opportunityFromQuery(row: SummaryMetric & { query: string }): SearchOpportunity | null {
  if (row.impressions <= 0) return null;
  if (row.position >= 4 && row.position <= 20) {
    return {
      kind: "near_top",
      page: null,
      ...row,
      recommendation:
        "Усилить целевую страницу: ответ в первом экране, внутренние ссылки, карта или практический блок.",
    };
  }
  if (row.position > 0 && row.position <= 10 && row.ctr < 0.02 && row.impressions >= 20) {
    return {
      kind: "low_ctr",
      page: null,
      ...row,
      recommendation: "Перепроверить заголовок и описание: страница видна, но по ней редко переходят.",
    };
  }
  if (row.position > 0 && row.position <= 3 && row.clicks > 0) {
    return {
      kind: "protect_winner",
      page: null,
      ...row,
      recommendation: "Сохранить лидерство: контролировать актуальность, источники и отсутствие дублей.",
    };
  }
  return null;
}

export async function fetchSearchVisibilitySnapshot(days = 28): Promise<SearchVisibilitySnapshot> {
  const supabase = createSupabaseAdminClient();
  const [{ data: connectionRows, error: connectionError }, summaryResult] = await Promise.all([
    supabase
      .from("seo_provider_connections")
      .select(
        "provider, property_url, credential_label, status, last_verified_at, last_synced_at, last_error_code",
      )
      .order("provider"),
    supabase.rpc("seo_search_performance_summary", { p_days: days }),
  ]);
  if (connectionError) throw connectionError;
  if (summaryResult.error) throw summaryResult.error;

  const connections = (connectionRows ?? []).map(normalizeConnection);
  const summary = (summaryResult.data ?? {}) as SummaryPayload;
  const topQueries = (summary.queries ?? []).flatMap((row) => {
    if (typeof row.query !== "string" || !row.query.trim()) return [];
    return [{
      query: row.query,
      clicks: safeNumber(row.clicks),
      impressions: safeNumber(row.impressions),
      ctr: safeNumber(row.ctr),
      position: safeNumber(row.position),
    }];
  });
  const topPages = (summary.pages ?? []).flatMap((row) => {
    if (typeof row.page !== "string" || !row.page.trim()) return [];
    return [{
      page: row.page,
      clicks: safeNumber(row.clicks),
      impressions: safeNumber(row.impressions),
      ctr: safeNumber(row.ctr),
      position: safeNumber(row.position),
    }];
  });
  const opportunities = topQueries
    .map(opportunityFromQuery)
    .filter((row): row is SearchOpportunity => row !== null)
    .sort((left, right) => right.impressions - left.impressions)
    .slice(0, 30);
  const totals = summary.totals ?? {};
  const impressions = safeNumber(totals.impressions);

  return {
    generatedAt: new Date().toISOString(),
    period: {
      from: typeof summary.from === "string" ? summary.from : dateDaysAgo(days),
      to: typeof summary.to === "string" ? summary.to : new Date().toISOString().slice(0, 10),
    },
    connections,
    totals: {
      clicks: safeNumber(totals.clicks),
      impressions,
      ctr: safeNumber(totals.ctr),
      position: impressions > 0 ? safeNumber(totals.position) : null,
    },
    topQueries: topQueries.slice(0, 50),
    topPages: topPages.slice(0, 50),
    opportunities,
    dataStatus:
      connections.length === 0 ? "not_connected" : impressions > 0 ? "connected" : "awaiting_sync",
  };
}

export async function saveSearchProviderConnection(input: {
  provider: SearchVisibilityProvider;
  propertyUrl: string;
  secret: string;
  credentialLabel: string;
  actorId: string;
}): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("seo_upsert_provider_connection", {
    p_provider: input.provider,
    p_property_url: input.propertyUrl,
    p_secret: input.secret,
    p_credential_label: input.credentialLabel,
    p_actor_user_id: actorUuid(input.actorId),
  });
  if (error) throw error;
}

export async function deleteSearchProviderConnection(input: {
  provider: SearchVisibilityProvider;
  actorId: string;
}): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("seo_delete_provider_connection", {
    p_provider: input.provider,
    p_actor_user_id: actorUuid(input.actorId),
  });
  if (error) throw error;
}

async function writePerformanceRows(rows: SearchPerformanceInput[]): Promise<number> {
  const supabase = createSupabaseAdminClient();
  let written = 0;
  for (let offset = 0; offset < rows.length; offset += 500) {
    const chunk = rows.slice(offset, offset + 500).map((row) => ({
      provider: row.provider,
      property_url: row.propertyUrl,
      metric_date: row.metricDate,
      query: row.query,
      page: row.page,
      country: row.country,
      device: row.device,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      fetched_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("seo_search_performance_daily").upsert(chunk, {
      onConflict: "provider,property_url,metric_date,query,page,country,device",
    });
    if (error) throw error;
    written += chunk.length;
  }
  return written;
}

export async function syncSearchProvider(
  provider: SearchVisibilityProvider,
  triggeredBy: "admin" | "cron",
): Promise<{ rowsReceived: number; rowsWritten: number }> {
  const supabase = createSupabaseAdminClient();
  const { data: run, error: runError } = await supabase
    .from("seo_search_sync_runs")
    .insert({ provider, status: "running", triggered_by: triggeredBy })
    .select("id")
    .single();
  if (runError) throw runError;

  try {
    const { data: secretRows, error: secretError } = await supabase.rpc(
      "seo_get_provider_secret",
      { p_provider: provider },
    );
    if (secretError) throw secretError;
    const credential = secretRows?.[0];
    if (!credential?.secret_value) {
      throw new SearchProviderError("INVALID_CREDENTIAL", "Подключение ещё не настроено.");
    }

    const rows =
      provider === "google_search_console"
        ? await fetchGoogleSearchPerformance({
            propertyUrl: credential.property_url,
            secret: credential.secret_value,
            dateFrom: dateDaysAgo(92),
            dateTo: dateDaysAgo(3),
          })
        : await fetchYandexSearchPerformance({
            propertyUrl: credential.property_url,
            secret: credential.secret_value,
          });
    const rowsWritten = await writePerformanceRows(rows);
    const finishedAt = new Date().toISOString();
    await Promise.all([
      supabase
        .from("seo_search_sync_runs")
        .update({
          status: "succeeded",
          finished_at: finishedAt,
          rows_received: rows.length,
          rows_written: rowsWritten,
          error_code: null,
        })
        .eq("id", run.id),
      supabase
        .from("seo_provider_connections")
        .update({
          status: "verified",
          last_verified_at: finishedAt,
          last_synced_at: finishedAt,
          last_error_code: null,
          updated_at: finishedAt,
        })
        .eq("provider", provider),
      supabase
        .from("seo_search_performance_daily")
        .delete()
        .lt("metric_date", dateDaysAgo(400)),
    ]);
    return { rowsReceived: rows.length, rowsWritten };
  } catch (error) {
    const code = cleanErrorCode(error);
    const finishedAt = new Date().toISOString();
    await Promise.all([
      supabase
        .from("seo_search_sync_runs")
        .update({ status: "failed", finished_at: finishedAt, error_code: code })
        .eq("id", run.id),
      supabase
        .from("seo_provider_connections")
        .update({ status: "error", last_error_code: code, updated_at: finishedAt })
        .eq("provider", provider),
    ]);
    throw new SearchProviderError(
      error instanceof SearchProviderError ? error.code : "PROVIDER_UNAVAILABLE",
      userFacingError(error),
    );
  }
}
