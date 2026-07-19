import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncSearchProvider } from "@/lib/seo/search-visibility-server";
import type { SearchVisibilityProvider } from "@/lib/seo/search-visibility-types";

export const dynamic = "force-dynamic";

async function run(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("seo_provider_connections").select("provider");
  if (error) {
    return NextResponse.json({ ok: false, error: "Поисковое хранилище недоступно" }, { status: 503 });
  }
  const providers = (data ?? []).map((row) => row.provider as SearchVisibilityProvider);
  if (providers.length === 0) {
    return NextResponse.json({ ok: true, skipped: true, message: "Нет подключённых поисковых систем" });
  }
  const settled = await Promise.allSettled(
    providers.map(async (provider) => ({ provider, ...(await syncSearchProvider(provider, "cron")) })),
  );
  const results = settled.map((result, index) =>
    result.status === "fulfilled"
      ? { ok: true, ...result.value }
      : { ok: false, provider: providers[index], error: "Синхронизация не выполнена" },
  );
  return NextResponse.json({ ok: results.every((result) => result.ok), results });
}

export const GET = run;
export const POST = run;
