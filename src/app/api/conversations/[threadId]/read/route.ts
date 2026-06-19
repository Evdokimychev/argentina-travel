import { NextResponse } from "next/server";
import { isSupabaseMessagingEnabled } from "@/lib/auth-mode";
import {
  assertThreadAccess,
  markConversationMessagesRead,
} from "@/lib/messaging/conversation-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";

type PostBody = {
  messageIds?: string[];
};

export async function POST(
  request: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  if (!isSupabaseMessagingEnabled()) {
    return NextResponse.json({ error: "Messaging API unavailable" }, { status: 503 });
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

    const result = await markConversationMessagesRead(
      supabase,
      access.thread,
      sessionUser.id,
      body.messageIds ?? []
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ marked: result.marked });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
