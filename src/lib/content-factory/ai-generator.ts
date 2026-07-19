import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  CONTENT_FACTORY_PROJECT_KEY,
  type ContentChannel,
  type ContentFactoryFormat,
  type ContentGenerationResult,
  type GeneratedContentVariant,
} from "@/lib/content-factory/types";
import type { Json } from "@/types/database";

const PROMPT_VERSION = "content-factory-v2";
const DEFAULT_MODEL = "gpt-5.6-luna";

type GenerationInput = {
  title: string;
  brief: string;
  audience: string;
  contentPillar: string;
  goal: string;
  channels: ContentChannel[];
  sourceDocumentId?: string;
  sourceCandidateId?: string;
  actorId: string;
};

type SourceMaterial = {
  title: string;
  body: string;
  status: string;
  kind: "cms" | "candidate" | "brief";
};

const CHANNEL_FORMATS: Record<ContentChannel, ContentFactoryFormat> = {
  telegram: "post",
  instagram: "post",
  whatsapp: "message",
};

const outputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["variants", "quality"],
  properties: {
    variants: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["channel", "format", "headline", "body", "hashtags", "altText", "firstComment", "mediaBrief", "callToAction"],
        properties: {
          channel: { type: "string", enum: ["telegram", "instagram", "whatsapp"] },
          format: { type: "string", enum: ["post", "carousel", "reel", "story", "message", "template"] },
          headline: { type: "string" },
          body: { type: "string" },
          hashtags: { type: "array", items: { type: "string" } },
          altText: { type: "string" },
          firstComment: { type: ["string", "null"] },
          mediaBrief: { type: "string" },
          callToAction: { type: "string" },
        },
      },
    },
    quality: {
      type: "object",
      additionalProperties: false,
      required: ["score", "warnings", "factsNeedReview"],
      properties: {
        score: { type: "integer", minimum: 0, maximum: 100 },
        warnings: { type: "array", items: { type: "string" } },
        factsNeedReview: { type: "array", items: { type: "string" } },
      },
    },
  },
} as const;

function actorUuid(actorId: string): string | null {
  return actorId === "service-role" ? null : actorId;
}

function outputText(payload: Record<string, unknown>): string | null {
  if (typeof payload.output_text === "string") return payload.output_text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    const content = (item as { content?: unknown[] }).content ?? [];
    for (const part of content) {
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") return text;
    }
  }
  return null;
}

function jsonBodyText(value: Json): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

async function resolveSource(input: GenerationInput): Promise<SourceMaterial> {
  const supabase = createSupabaseAdminClient();
  if (input.sourceDocumentId) {
    const { data, error } = await supabase
      .from("content_documents")
      .select("title,body,status")
      .eq("id", input.sourceDocumentId)
      .neq("status", "archived")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Выбранный материал сайта не найден.");
    return { title: data.title, body: jsonBodyText(data.body).slice(0, 45_000), status: data.status, kind: "cms" };
  }
  if (input.sourceCandidateId) {
    const { data, error } = await supabase
      .from("ingestion_candidates")
      .select("title,processed_content,status")
      .eq("id", input.sourceCandidateId)
      .in("status", ["approved", "published"])
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Источник Argentina Knowledge ещё не прошёл редакционную проверку.");
    return { title: data.title, body: data.processed_content.slice(0, 45_000), status: data.status, kind: "candidate" };
  }
  return { title: input.title, body: input.brief, status: "owner_brief", kind: "brief" };
}

function fallbackVariants(input: GenerationInput, source: SourceMaterial): GeneratedContentVariant[] {
  return input.channels.map((channel) => {
    const core = input.brief.trim() || source.body.trim().slice(0, 1200);
    const callToAction = channel === "whatsapp"
      ? "Напишите, что именно хотите уточнить — отвечу лично."
      : "Сохраните материал и задайте вопрос в сообщениях проекта.";
    const body = channel === "telegram"
      ? `${input.title}\n\n${core}\n\n${callToAction}`
      : channel === "instagram"
        ? `${input.title}\n\n${core.slice(0, 1600)}\n\n${callToAction}`
        : `${core.slice(0, 900)}\n\n${callToAction}`;
    return {
      channel,
      format: CHANNEL_FORMATS[channel],
      headline: input.title,
      body,
      hashtags: channel === "instagram" ? ["Аргентина", "ПораВАргентину"] : [],
      altText: "",
      firstComment: null,
      mediaBrief: `Подобрать достоверную фотографию по теме «${input.title}» с подтверждёнными правами.`,
      callToAction,
    };
  });
}

function normalizeVariants(value: unknown, channels: ContentChannel[]): GeneratedContentVariant[] {
  if (!Array.isArray(value)) throw new Error("OPENAI_INVALID_VARIANTS");
  const requested = new Set(channels);
  const result = value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (row.channel !== "telegram" && row.channel !== "instagram" && row.channel !== "whatsapp") return [];
    const channel: ContentChannel = row.channel;
    if (!requested.has(channel)) return [];
    const format = typeof row.format === "string" ? row.format : CHANNEL_FORMATS[channel];
    if (!["post", "carousel", "reel", "story", "message", "template"].includes(format)) return [];
    const body = typeof row.body === "string" ? row.body.trim() : "";
    if (!body) return [];
    return [{
      channel,
      format: format as ContentFactoryFormat,
      headline: typeof row.headline === "string" ? row.headline.trim().slice(0, 240) : "",
      body: body.slice(0, 60_000),
      hashtags: Array.isArray(row.hashtags) ? row.hashtags.filter((tag): tag is string => typeof tag === "string").slice(0, 30) : [],
      altText: typeof row.altText === "string" ? row.altText.trim().slice(0, 1000) : "",
      firstComment: typeof row.firstComment === "string" ? row.firstComment.trim().slice(0, 2200) : null,
      mediaBrief: typeof row.mediaBrief === "string" ? row.mediaBrief.trim().slice(0, 2000) : "",
      callToAction: typeof row.callToAction === "string" ? row.callToAction.trim().slice(0, 500) : "",
    }];
  });
  if (result.length !== requested.size) throw new Error("OPENAI_MISSING_CHANNEL_VARIANT");
  return result;
}

async function writeRun(input: GenerationInput, values: {
  model: string;
  status: "succeeded" | "failed" | "fallback";
  source: SourceMaterial;
  output?: ContentGenerationResult;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  errorCode?: string;
}): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("content_factory_generation_runs").insert({
    project_key: CONTENT_FACTORY_PROJECT_KEY,
    source_document_id: input.sourceDocumentId || null,
    source_candidate_id: input.sourceCandidateId || null,
    provider: "openai",
    model: values.model,
    prompt_version: PROMPT_VERSION,
    status: values.status,
    requested_channels: input.channels,
    input_snapshot: {
      title: input.title,
      brief: input.brief.slice(0, 5000),
      audience: input.audience,
      contentPillar: input.contentPillar,
      goal: input.goal,
      sourceKind: values.source.kind,
      sourceStatus: values.source.status,
    },
    output_snapshot: values.output ? { variants: values.output.variants } : {},
    quality_report: values.output?.quality ?? {},
    input_tokens: values.inputTokens ?? null,
    output_tokens: values.outputTokens ?? null,
    latency_ms: values.latencyMs,
    error_code: values.errorCode ?? null,
    created_by: actorUuid(input.actorId),
    completed_at: new Date().toISOString(),
  }).select("id").single();
  if (error) return null;
  return data.id;
}

export async function generateContentVariants(input: GenerationInput): Promise<ContentGenerationResult> {
  if (!input.title.trim() || !input.brief.trim()) throw new Error("Заполните название и замысел материала.");
  if (!input.channels.length) throw new Error("Выберите хотя бы один канал.");
  const source = await resolveSource(input);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_CONTENT_FACTORY_MODEL?.trim() || DEFAULT_MODEL;
  const started = Date.now();

  if (!apiKey) {
    const result: ContentGenerationResult = {
      runId: null,
      mode: "fallback",
      model: "rule-based",
      variants: fallbackVariants(input, source),
      quality: {
        score: 62,
        warnings: ["OpenAI не подключён: создан безопасный структурный черновик без новых фактов."],
        factsNeedReview: source.kind === "brief" ? ["Все факты из замысла владельца требуют подтверждения перед публикацией."] : [],
      },
    };
    result.runId = await writeRun(input, { model: result.model, status: "fallback", source, output: result, latencyMs: Date.now() - started });
    return result;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        model,
        store: false,
        reasoning: { effort: "low" },
        instructions: [
          "Ты редакционный продюсер проекта «Пора в Аргентину».",
          "Пиши на литературном русском без канцелярита, SEO-спама и выдуманных фактов.",
          "Используй только предоставленный источник. Если факта в нём нет — вынеси его в factsNeedReview.",
          "Сделай самостоятельную версию для каждого запрошенного канала, не копируй один текст дословно.",
          "WhatsApp — личный сервисный диалог; не создавай безадресную рекламную рассылку.",
          "Instagram должен включать визуальный замысел и alt-текст; Telegram — полезную самостоятельную заметку.",
          "Каждая версия должна иметь одно понятное следующее действие читателя.",
        ].join("\n"),
        input: JSON.stringify({
          title: input.title,
          brief: input.brief,
          audience: input.audience,
          contentPillar: input.contentPillar,
          goal: input.goal,
          requestedChannels: input.channels,
          source: { kind: source.kind, title: source.title, status: source.status, body: source.body },
        }),
        text: { format: { type: "json_schema", name: "content_factory_variants", strict: true, schema: outputSchema } },
      }),
    });
    const payload = await response.json() as Record<string, unknown>;
    if (!response.ok) throw new Error(`OPENAI_HTTP_${response.status}`);
    const text = outputText(payload);
    if (!text) throw new Error("OPENAI_EMPTY_OUTPUT");
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const qualityRow = parsed.quality && typeof parsed.quality === "object" ? parsed.quality as Record<string, unknown> : {};
    const result: ContentGenerationResult = {
      runId: null,
      mode: "ai",
      model: typeof payload.model === "string" ? payload.model : model,
      variants: normalizeVariants(parsed.variants, input.channels),
      quality: {
        score: typeof qualityRow.score === "number" ? Math.max(0, Math.min(100, qualityRow.score)) : 0,
        warnings: Array.isArray(qualityRow.warnings) ? qualityRow.warnings.filter((item): item is string => typeof item === "string") : [],
        factsNeedReview: Array.isArray(qualityRow.factsNeedReview) ? qualityRow.factsNeedReview.filter((item): item is string => typeof item === "string") : [],
      },
    };
    const usage = payload.usage && typeof payload.usage === "object" ? payload.usage as Record<string, unknown> : {};
    result.runId = await writeRun(input, {
      model: result.model,
      status: "succeeded",
      source,
      output: result,
      inputTokens: typeof usage.input_tokens === "number" ? usage.input_tokens : undefined,
      outputTokens: typeof usage.output_tokens === "number" ? usage.output_tokens : undefined,
      latencyMs: Date.now() - started,
    });
    return result;
  } catch (error) {
    const fallback: ContentGenerationResult = {
      runId: null,
      mode: "fallback",
      model: "rule-based",
      variants: fallbackVariants(input, source),
      quality: {
        score: 58,
        warnings: ["AI-сервис временно недоступен: создан безопасный черновик без новых фактов."],
        factsNeedReview: ["Проверьте факты и адаптацию текста перед одобрением."],
      },
    };
    fallback.runId = await writeRun(input, {
      model,
      status: "fallback",
      source,
      output: fallback,
      latencyMs: Date.now() - started,
      errorCode: error instanceof Error ? error.message.slice(0, 120) : "OPENAI_FAILED",
    });
    return fallback;
  }
}
