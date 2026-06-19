import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { API_KEY_SELECT_COLUMNS, mapApiKeyRow } from "@/lib/public-api/api-key-mapper";
import { generatePublicApiKey } from "@/lib/public-api/keys";
import { attachUsageStats, fetchApiKeyUsageStats } from "@/lib/public-api/usage-log";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { userHasAccountRole } from "@/types/user";

async function requireOrganizerSession() {
  if (!isSupabaseConfigured()) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Интеграции недоступны" }, { status: 503 }),
    };
  }

  const supabase = await createSupabaseServerClient();
  const sessionUser = await loadSessionUserFromSupabase(supabase);

  if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Доступ запрещён" }, { status: 403 }),
    };
  }

  return { ok: true as const, organizerId: sessionUser.id };
}

export async function GET() {
  const auth = await requireOrganizerSession();
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select(API_KEY_SELECT_COLUMNS)
    .eq("organizer_id", auth.organizerId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const keys = (data ?? []).map(mapApiKeyRow);
  const stats = await fetchApiKeyUsageStats(keys.map((key) => key.id));

  return NextResponse.json({
    keys: attachUsageStats(keys, stats),
    organizerId: auth.organizerId,
  });
}

type PostBody = {
  label?: string;
};

export async function POST(request: Request) {
  const auth = await requireOrganizerSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as PostBody;
  const label = body.label?.trim();
  if (!label) {
    return NextResponse.json({ error: "Укажите название ключа" }, { status: 400 });
  }

  const { rawKey, keyHash, keyPrefix } = generatePublicApiKey();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      key_hash: keyHash,
      key_prefix: keyPrefix,
      label,
      organizer_id: auth.organizerId,
      scopes: ["tours:read", "excursions:read"],
      rate_limit_per_minute: 60,
      created_by: auth.organizerId,
    })
    .select(API_KEY_SELECT_COLUMNS)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Не удалось создать ключ" }, { status: 500 });
  }

  return NextResponse.json({
    key: {
      ...mapApiKeyRow(data),
      usage: { requestsLast7d: 0, topEndpoints: [] },
    },
    rawKey,
  });
}
