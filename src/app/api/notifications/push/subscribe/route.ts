import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  hasAnalyticsConsentFromCookieValue,
} from "@/lib/cookie-consent";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";

type PushSubscriptionBody = {
  endpoint?: string;
  p256dh?: string;
  auth?: string;
};

function normalizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

async function loadRequestBody(request: Request): Promise<PushSubscriptionBody> {
  try {
    return (await request.json()) as PushSubscriptionBody;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Push API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    const writeClient = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
      ? createSupabaseAdminClient()
      : supabase;

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const consentCookie = cookieStore.get(COOKIE_CONSENT_COOKIE_NAME)?.value ?? null;
    if (!hasAnalyticsConsentFromCookieValue(consentCookie)) {
      return NextResponse.json(
        { error: "Для push-уведомлений нужно согласие на аналитику" },
        { status: 403 }
      );
    }

    const body = await loadRequestBody(request);
    const endpoint = normalizeText(body.endpoint, 3000);
    const p256dh = normalizeText(body.p256dh, 512);
    const auth = normalizeText(body.auth, 512);

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: "Передайте endpoint, p256dh и auth подписки" },
        { status: 400 }
      );
    }

    const { error } = await writeClient
      .from("push_subscriptions")
      .upsert(
        {
          user_id: sessionUser.id,
          endpoint,
          p256dh,
          auth,
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      return NextResponse.json(
        { error: "Не удалось сохранить push-подписку" },
        { status: error.code === "42501" ? 403 : 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Push API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    const writeClient = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
      ? createSupabaseAdminClient()
      : supabase;

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await loadRequestBody(request);
    const endpoint = normalizeText(body.endpoint, 3000);

    let query = writeClient.from("push_subscriptions").delete().eq("user_id", sessionUser.id);
    if (endpoint) {
      query = query.eq("endpoint", endpoint);
    }

    const { error } = await query;
    if (error) {
      return NextResponse.json({ error: "Не удалось удалить push-подписку" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
