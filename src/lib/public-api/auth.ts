import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { hashPublicApiKey, publicApiKeyHasScope } from "@/lib/public-api/keys";
import { logPublicApiKeyUsage } from "@/lib/public-api/usage-log";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { PublicApiScope } from "@/types/public-api";

export type ResolvedPublicApiKey = {
  id: string;
  label: string;
  partnerName: string | null;
  organizerId: string | null;
  scopes: string[];
  rateLimitPerMinute: number;
};

function parseApiKeyFromRequest(request: Request): string | null {
  const headerKey = request.headers.get("x-api-key")?.trim();
  if (headerKey) return headerKey;

  const auth = request.headers.get("authorization")?.trim();
  if (!auth) return null;
  const [scheme, ...parts] = auth.split(" ");
  if (scheme.toLowerCase() !== "bearer") return null;
  const token = parts.join(" ").trim();
  return token || null;
}

function compareHash(input: string, stored: string): boolean {
  const left = Buffer.from(input, "utf8");
  const right = Buffer.from(stored, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function resolvePublicApiKey(
  request: Request
): Promise<{ ok: true; key: ResolvedPublicApiKey } | { ok: false; response: NextResponse }> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Public API unavailable" }, { status: 503 }),
    };
  }

  const rawKey = parseApiKeyFromRequest(request);
  if (!rawKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Требуется API-ключ (Authorization: Bearer … или X-API-Key)" },
        { status: 401 }
      ),
    };
  }

  const keyHash = hashPublicApiKey(rawKey);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, label, partner_name, organizer_id, scopes, rate_limit_per_minute, is_active, revoked_at, key_hash")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      response: NextResponse.json({ error: error.message }, { status: 500 }),
    };
  }

  if (!data || !data.is_active || data.revoked_at || !compareHash(data.key_hash, keyHash)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Недействительный API-ключ" }, { status: 401 }),
    };
  }

  const limit = await checkRateLimit(
    `public-api:key:${data.id}`,
    data.rate_limit_per_minute,
    60_000
  );
  if (!limit.ok) {
    const endpoint = new URL(request.url).pathname;
    void logPublicApiKeyUsage({
      keyId: data.id,
      endpoint,
      status: 429,
    });
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Превышен лимит запросов" },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSec) },
        }
      ),
    };
  }

  void supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return {
    ok: true,
    key: {
      id: data.id,
      label: data.label,
      partnerName: data.partner_name,
      organizerId: data.organizer_id,
      scopes: data.scopes ?? [],
      rateLimitPerMinute: data.rate_limit_per_minute,
    },
  };
}

export function requirePublicApiScope(
  key: ResolvedPublicApiKey,
  scope: PublicApiScope
): NextResponse | null {
  if (publicApiKeyHasScope(key.scopes, scope)) return null;
  return NextResponse.json({ error: "Недостаточно прав для этого ресурса" }, { status: 403 });
}
