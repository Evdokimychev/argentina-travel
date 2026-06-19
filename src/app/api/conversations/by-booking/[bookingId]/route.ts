import { NextResponse } from "next/server";
import { isSupabaseMessagingEnabled } from "@/lib/auth-mode";
import {
  fetchConversationMessages,
  getOrCreateConversationThreadForBooking,
} from "@/lib/messaging/conversation-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";

export async function GET(
  _request: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  if (!isSupabaseMessagingEnabled()) {
    return NextResponse.json({ error: "Messaging API unavailable" }, { status: 503 });
  }

  const { bookingId } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser) {
      return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });
    }

    const result = await getOrCreateConversationThreadForBooking(
      supabase,
      bookingId,
      sessionUser,
      sessionUser.email
    );

    if ("error" in result) {
      const status = result.error.includes("не найдена") ? 404 : 403;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ thread: result.thread });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
