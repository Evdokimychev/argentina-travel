import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { matchToursWithAssistant } from "@/lib/ai/tour-matcher";
import {
  loadTourMatchSession,
  logTourMatchEvent,
  persistTourMatchSession,
} from "@/lib/ai/tour-match-sessions-server";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Json } from "@/types/database";
import type { TourMatchRequest, TourMatchResponse, TourMatchSessionMessage } from "@/types/tour-match";

const QUERY_MIN = 3;
const QUERY_MAX = 800;

function normalizeQuery(query: string): string {
  return query.trim().slice(0, QUERY_MAX);
}

async function resolveUserId(request: Request): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const supabase = createSupabaseAdminClient();
    const token = authHeader.slice(7);
    const { data } = await supabase.auth.getUser(token);
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: TourMatchRequest;
  try {
    body = (await request.json()) as TourMatchRequest;
  } catch {
    return NextResponse.json({ error: "Некорректный JSON." }, { status: 400 });
  }

  const query = normalizeQuery(body.query ?? "");
  if (!query) {
    return NextResponse.json({ error: "Опишите, какой тур ищете." }, { status: 400 });
  }
  if (query.length < QUERY_MIN) {
    return NextResponse.json(
      { error: "Запрос слишком короткий — добавьте регион, бюджет или длительность." },
      { status: 400 }
    );
  }

  const sessionId = body.sessionId?.trim() || randomUUID();
  const userId = await resolveUserId(request);
  const previousMessages = (await loadTourMatchSession(sessionId)) ?? [];

  const tours = await fetchMarketplaceTours();
  const result = await matchToursWithAssistant(query, tours, body.filters);

  const timestamp = new Date().toISOString();
  const userMessage: TourMatchSessionMessage = {
    role: "user",
    content: query,
    timestamp,
  };
  const assistantMessage: TourMatchSessionMessage = {
    role: "assistant",
    content: result.explanation,
    timestamp,
    tourSlugs: result.tours.map((item) => item.tour.slug),
  };
  const nextMessages: TourMatchSessionMessage[] = [
    ...previousMessages,
    userMessage,
    assistantMessage,
  ].slice(-20);

  await persistTourMatchSession({
    sessionId,
    userId,
    messages: nextMessages,
  });

  void logTourMatchEvent({
    sessionId,
    eventType: "match_query",
    metadata: {
      query_length: query.length,
      mode: result.mode,
      ai_configured: result.aiConfigured,
      tours_count: result.tours.length,
      top_score: result.tours[0]?.score ?? null,
      region: result.intent.region ?? null,
    } as Record<string, Json>,
  });

  if (result.tours.length > 0) {
    void logTourMatchEvent({
      sessionId,
      eventType: "match_result",
      metadata: {
        slugs: result.tours.map((item) => item.tour.slug),
        mode: result.mode,
      } as Record<string, Json>,
    });
  }

  const response: TourMatchResponse = {
    explanation: result.explanation,
    tours: result.tours,
    sessionId,
    mode: result.mode,
    aiConfigured: result.aiConfigured,
    intent: {
      region: result.intent.region,
      budgetMaxUsd: result.intent.budgetMaxUsd,
      budgetMinUsd: result.intent.budgetMinUsd,
      durationMinDays: result.intent.durationMinDays,
      durationMaxDays: result.intent.durationMaxDays,
      audience: result.intent.audience,
      pace: result.intent.pace,
      fitness: result.intent.fitness,
    },
  };

  return NextResponse.json(response);
}

export async function GET() {
  const { isGuideAssistantAiConfigured } = await import("@/lib/ai/guide-assistant");
  return NextResponse.json({
    endpoint: "/api/ai/tour-match",
    method: "POST",
    aiConfigured: isGuideAssistantAiConfigured(),
    description:
      "Диалоговый подбор тура по каталогу. Без AI-ключа работает rule-based scoring с пояснениями на русском.",
    body: {
      query: "string (обязательно)",
      filters: "TourMatchFilters (опционально)",
      sessionId: "uuid (опционально, для памяти диалога)",
    },
  });
}
