import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveDatabaseUrl, createPgClientConfig } from "@/lib/database-url";
import { classifyFeedFreshness } from "@/lib/partner-tours/freshness";
import pg from "pg";

type PartnerProbe = {
  status: "ok" | "degraded" | "down";
  count: number | null;
  lastSyncStatus: string | null;
  lastSyncAt: string | null;
  freshness: ReturnType<typeof classifyFeedFreshness>;
};

async function countViaPg(table: string): Promise<number> {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) throw new Error("postgres_not_configured");
  const client = new pg.Client({
    ...createPgClientConfig(connectionString),
    connectionTimeoutMillis: 5_000,
    query_timeout: 5_000,
  });
  try {
    await client.connect();
    const { rows } = await client.query<{ c: number }>(
      `select count(*)::int as c from public.${table}`,
    );
    return rows[0]?.c ?? 0;
  } finally {
    await client.end().catch(() => undefined);
  }
}

function withFreshness(probe: Omit<PartnerProbe, "freshness">): PartnerProbe {
  return {
    ...probe,
    freshness: classifyFeedFreshness({ syncedAt: probe.lastSyncAt }),
  };
}

async function probeTripster(): Promise<PartnerProbe> {
  try {
    const supabase = createSupabaseAdminClient();
    const [{ count, error }, sync] = await Promise.all([
      supabase
        .from("tripster_experiences")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("tripster_sync_runs")
        .select("status, finished_at, experiences_synced")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (error) throw error;

    const lastSyncStatus = sync.data?.status ?? null;
    const experiencesSynced =
      typeof sync.data?.experiences_synced === "number"
        ? sync.data.experiences_synced
        : null;
    const failedZero =
      lastSyncStatus === "success" && experiencesSynced === 0 && (count ?? 0) === 0;

    return withFreshness({
      status: failedZero || lastSyncStatus === "failed" ? "degraded" : "ok",
      count: count ?? 0,
      lastSyncStatus,
      lastSyncAt: sync.data?.finished_at ?? null,
    });
  } catch {
    try {
      const count = await countViaPg("tripster_experiences");
      return withFreshness({
        status: "degraded",
        count,
        lastSyncStatus: null,
        lastSyncAt: null,
      });
    } catch {
      return withFreshness({
        status: "down",
        count: null,
        lastSyncStatus: null,
        lastSyncAt: null,
      });
    }
  }
}

async function probeYouTravel(): Promise<PartnerProbe> {
  try {
    const supabase = createSupabaseAdminClient();
    const [{ count, error }, sync] = await Promise.all([
      supabase.from("youtravel_tours").select("*", { count: "exact", head: true }),
      supabase
        .from("youtravel_sync_runs")
        .select("status, finished_at, tours_fetched")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (error) throw error;

    const lastSyncStatus = sync.data?.status ?? null;
    const toursFetched =
      typeof sync.data?.tours_fetched === "number" ? sync.data.tours_fetched : null;
    const failedZero =
      lastSyncStatus === "success" && toursFetched === 0 && (count ?? 0) === 0;

    return withFreshness({
      status: failedZero || lastSyncStatus === "error" || lastSyncStatus === "failed"
        ? "degraded"
        : "ok",
      count: count ?? 0,
      lastSyncStatus,
      lastSyncAt: sync.data?.finished_at ?? null,
    });
  } catch {
    try {
      const count = await countViaPg("youtravel_tours");
      return withFreshness({
        status: "degraded",
        count,
        lastSyncStatus: null,
        lastSyncAt: null,
      });
    } catch {
      return withFreshness({
        status: "down",
        count: null,
        lastSyncStatus: null,
        lastSyncAt: null,
      });
    }
  }
}

async function probeSputnik8(): Promise<PartnerProbe> {
  try {
    const supabase = createSupabaseAdminClient();
    const [{ count, error }, sync] = await Promise.all([
      supabase.from("sputnik8_products").select("*", { count: "exact", head: true }),
      supabase
        .from("sputnik8_sync_runs")
        .select("status, finished_at, experiences_synced")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (error) throw error;

    const lastSyncStatus = sync.data?.status ?? null;
    const productsSynced =
      typeof sync.data?.experiences_synced === "number"
        ? sync.data.experiences_synced
        : null;
    const failedZero =
      lastSyncStatus === "success" && productsSynced === 0 && (count ?? 0) === 0;

    return withFreshness({
      status: failedZero || lastSyncStatus === "failed" || lastSyncStatus === "error"
        ? "degraded"
        : "ok",
      count: count ?? 0,
      lastSyncStatus,
      lastSyncAt: sync.data?.finished_at ?? null,
    });
  } catch {
    try {
      const count = await countViaPg("sputnik8_products");
      return withFreshness({
        status: "degraded",
        count,
        lastSyncStatus: null,
        lastSyncAt: null,
      });
    } catch {
      return withFreshness({
        status: "down",
        count: null,
        lastSyncStatus: null,
        lastSyncAt: null,
      });
    }
  }
}

export async function GET() {
  const [tripster, youtravel, sputnik8] = await Promise.all([
    probeTripster(),
    probeYouTravel(),
    probeSputnik8(),
  ]);
  const statuses = [tripster.status, youtravel.status, sputnik8.status];
  const status = statuses.every((value) => value === "ok")
    ? "ok"
    : statuses.every((value) => value === "down")
      ? "down"
      : "degraded";

  return NextResponse.json(
    {
      status,
      generatedAt: new Date().toISOString(),
      partners: { tripster, youtravel, sputnik8 },
    },
    {
      status: status === "down" ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
