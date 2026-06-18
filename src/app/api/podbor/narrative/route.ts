import { NextResponse } from "next/server";
import {
  buildPodborNarrative,
  PODBOR_AI_SYSTEM_PROMPT,
} from "@/lib/podbor/narrative";
import { buildPodborMatchResult } from "@/lib/podbor/matching";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import type { PodborAiNarrativeRequest } from "@/types/podbor";

/**
 * POST /api/podbor/narrative
 * Сейчас — шаблонный текст. Для OpenAI: передайте body.aiPayload в chat.completions
 * с system = PODBOR_AI_SYSTEM_PROMPT и user = JSON.stringify(aiPayload).
 */
export async function POST(request: Request) {
  let payload: PodborAiNarrativeRequest | null = null;

  try {
    const body = (await request.json()) as { aiPayload?: PodborAiNarrativeRequest };
    payload = body.aiPayload ?? null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload?.answers) {
    return NextResponse.json({ error: "aiPayload required" }, { status: 400 });
  }

  const tours = await fetchMarketplaceTours();
  const result = buildPodborMatchResult(payload.answers, tours);

  const narrative = buildPodborNarrative({
    ...result,
    aiPayload: payload,
  });

  return NextResponse.json({
    narrative,
    source: "template" as const,
    openAiReady: true,
    systemPrompt: PODBOR_AI_SYSTEM_PROMPT,
    hint:
      "Подключите OPENAI_API_KEY и замените template на chat.completions с переданным aiPayload.",
  });
}
