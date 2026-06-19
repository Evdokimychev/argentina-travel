import { NextResponse } from "next/server";
import { isSupabaseMessagingEnabled } from "@/lib/auth-mode";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  assertThreadAccess,
  fetchConversationMessages,
  insertConversationMessage,
} from "@/lib/messaging/conversation-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";

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

    const messages = await fetchConversationMessages(supabase, access.thread);
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

type PostBody = {
  body?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  if (!isSupabaseMessagingEnabled()) {
    return NextResponse.json({ error: "Messaging API unavailable" }, { status: 503 });
  }

  const ip = getClientIp(request);
  const limit = checkRateLimit(`conversation-msg:ip:${ip}`, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много сообщений. Повторите позже." },
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

    const result = await insertConversationMessage(
      supabase,
      access.thread,
      sessionUser.id,
      body.body ?? ""
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
