import { NextResponse } from "next/server";
import {
  askGuideAssistant,
  isGuideAssistantAiConfigured,
  normalizeGuideQuestion,
} from "@/lib/ai/guide-assistant";
import { logAnalyticsEvent } from "@/lib/analytics/events-server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { GuideAssistantAskRequest } from "@/types/guide-assistant";

const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = await checkRateLimit(`assistant:ip:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Подождите минуту и попробуйте снова." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  let body: GuideAssistantAskRequest;
  try {
    body = (await request.json()) as GuideAssistantAskRequest;
  } catch {
    return NextResponse.json({ error: "Некорректный JSON." }, { status: 400 });
  }

  const question = normalizeGuideQuestion(body.question ?? "");
  if (!question) {
    return NextResponse.json({ error: "Введите вопрос." }, { status: 400 });
  }

  if (question.length < 3) {
    return NextResponse.json(
      { error: "Вопрос слишком короткий — добавьте детали." },
      { status: 400 }
    );
  }

  const aiConfigured = isGuideAssistantAiConfigured();
  const result = await askGuideAssistant(question);

  let userId: string | null = null;
  if (isSupabaseConfigured()) {
    try {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const supabase = createSupabaseAdminClient();
        const token = authHeader.slice(7);
        const { data } = await supabase.auth.getUser(token);
        userId = data.user?.id ?? null;
      }
    } catch {
      /* optional auth */
    }
  }

  void logAnalyticsEvent({
    eventType: "assistant_ask",
    userId,
    sessionId: body.sessionId?.trim() || null,
    metadata: {
      question_length: question.length,
      page_url: body.pageUrl ?? null,
      mode: result.mode,
      ai_configured: aiConfigured,
      sources_count: result.sources.length,
    },
  });

  return NextResponse.json(result);
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/assistant/ask",
    method: "POST",
    aiConfigured: isGuideAssistantAiConfigured(),
    description:
      "Помощник по материалам путеводителя. Без AI-ключа возвращает подборку статей из поиска.",
  });
}
