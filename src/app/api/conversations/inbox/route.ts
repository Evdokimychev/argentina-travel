import { NextResponse } from "next/server";
import { isSupabaseMessagingEnabled } from "@/lib/auth-mode";
import {
  countConversationUnreadMessages,
  fetchConversationInboxSummary,
} from "@/lib/messaging/conversation-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import type { MessageSenderRole } from "@/types/messages";
import { userHasAccountRole } from "@/types/user";

function parseRole(raw: string | null, defaultRole: MessageSenderRole): MessageSenderRole {
  if (raw === "organizer" || raw === "tourist") return raw;
  return defaultRole;
}

function parseLimit(raw: string | null): number {
  const parsed = Number(raw ?? "50");
  if (!Number.isFinite(parsed) || parsed <= 0) return 50;
  return Math.min(Math.floor(parsed), 100);
}

export async function GET(request: Request) {
  if (!isSupabaseMessagingEnabled()) {
    return NextResponse.json({ error: "Messaging API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser) {
      return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });
    }

    const url = new URL(request.url);
    const defaultRole: MessageSenderRole = userHasAccountRole(sessionUser, "organizer")
      ? "organizer"
      : "tourist";
    const role = parseRole(url.searchParams.get("role"), defaultRole);
    const summaryOnly = url.searchParams.get("summary") === "1";
    const limit = parseLimit(url.searchParams.get("limit"));

    if (role === "organizer" && !userHasAccountRole(sessionUser, "organizer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (summaryOnly) {
      const unreadCount = await countConversationUnreadMessages(
        supabase,
        sessionUser.id,
        role
      );
      return NextResponse.json({ unreadCount });
    }

    const summary = await fetchConversationInboxSummary(supabase, sessionUser.id, role, {
      limit,
    });
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
