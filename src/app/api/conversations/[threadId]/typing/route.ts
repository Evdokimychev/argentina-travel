import { NextResponse } from "next/server";
import { isSupabaseMessagingEnabled } from "@/lib/auth-mode";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  assertThreadAccess,
  fetchActiveTypingUsers,
  setTypingPresence,
} from "@/lib/messaging/conversation-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";

type PostBody = {
  typing?: boolean;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  if (!isSupabaseMessagingEnabled()) {
    return NextResponse.json({ error: "Messaging API unavailable" }, { status: 503 });
  }

  const { threadId } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    const access = await assertThreadAccess(supabase, threadId, sessionUser);

    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const typing = await fetchActiveTypingUsers(
      supabase,
      threadId,
      sessionUser?.id
    );

    return NextResponse.json({ typing });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  if (!isSupabaseMessagingEnabled()) {
    return NextResponse.json({ error: "Messaging API unavailable" }, { status: 503 });
  }

  const ip = getClientIp(request);
  const limit = checkRateLimit(`conversation-typing:ip:${ip}`, 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Повторите позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const { threadId } = await context.params;

  try {
    const body = (await request.json()) as PostBody;
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    const access = await assertThreadAccess(supabase, threadId, sessionUser);

    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    if (!sessionUser) {
      return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });
    }

    const result = await setTypingPresence(
      supabase,
      threadId,
      sessionUser.id,
      Boolean(body.typing)
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const typing = await fetchActiveTypingUsers(
      supabase,
      threadId,
      sessionUser.id
    );

    return NextResponse.json({ ok: true, typing });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
