import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Json } from "@/types/database";
import type { TourMatchSessionMessage } from "@/types/tour-match";

const SESSION_TTL_DAYS = 7;

function sessionExpiresAt(): string {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_TTL_DAYS);
  return date.toISOString();
}

export async function loadTourMatchSession(
  sessionId: string
): Promise<TourMatchSessionMessage[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("ai_match_sessions")
      .select("messages, expires_at")
      .eq("id", sessionId)
      .maybeSingle();

    if (error || !data) return null;
    if (new Date(data.expires_at).getTime() < Date.now()) return null;

    const messages = data.messages;
    if (!Array.isArray(messages)) return [];
    return messages as TourMatchSessionMessage[];
  } catch {
    return null;
  }
}

export async function persistTourMatchSession(input: {
  sessionId: string;
  userId?: string | null;
  messages: TourMatchSessionMessage[];
}): Promise<string | null> {
  if (!isSupabaseConfigured()) return input.sessionId;

  try {
    const supabase = createSupabaseAdminClient();
    const expiresAt = sessionExpiresAt();
    const payload = {
      id: input.sessionId,
      user_id: input.userId ?? null,
      messages: input.messages as unknown as Json,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("ai_match_sessions").upsert(payload, {
      onConflict: "id",
    });

    if (error) return null;
    return input.sessionId;
  } catch {
    return null;
  }
}

export async function logTourMatchEvent(input: {
  sessionId: string;
  eventType: "match_query" | "match_result";
  metadata?: Record<string, Json>;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("ai_match_events").insert({
      session_id: input.sessionId,
      event_type: input.eventType,
      metadata: (input.metadata ?? {}) as Json,
    });
  } catch {
    /* analytics must not block matching */
  }
}
