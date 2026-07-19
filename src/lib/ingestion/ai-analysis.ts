import "server-only";
import type { Json } from "@/types/database";
import type { NormalizedIngestionDocument } from "@/types/ingestion";

export type AiIngestionAnalysis = {
  summary: string; category: string; tags: string[]; province: string | null; city: string | null;
  entities: Array<{ type: string; name: string }>; flags: string[]; freshnessScore: number;
  suggestedTarget: "knowledge" | "blog" | "news" | "place" | "city" | "region" | "route" | "map" | "event" | "warning" | "immigration" | "source_only";
};

const schema = {
  type: "object", additionalProperties: false,
  required: ["summary", "category", "tags", "province", "city", "entities", "flags", "freshnessScore", "suggestedTarget"],
  properties: {
    summary: { type: "string" }, category: { type: "string" }, tags: { type: "array", items: { type: "string" } },
    province: { type: ["string", "null"] }, city: { type: ["string", "null"] },
    entities: { type: "array", items: { type: "object", additionalProperties: false, required: ["type", "name"], properties: { type: { type: "string" }, name: { type: "string" } } } },
    flags: { type: "array", items: { type: "string" } }, freshnessScore: { type: "integer", minimum: 0, maximum: 100 },
    suggestedTarget: { type: "string", enum: ["knowledge", "blog", "news", "place", "city", "region", "route", "map", "event", "warning", "immigration", "source_only"] },
  },
};

function outputText(payload: Record<string, unknown>): string | null {
  if (typeof payload.output_text === "string") return payload.output_text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) for (const content of (item as { content?: unknown[] }).content ?? []) {
    const text = (content as { text?: unknown }).text;
    if (typeof text === "string") return text;
  }
  return null;
}

export async function analyzeWithOpenAi(document: NormalizedIngestionDocument, prompt: { id: string; model: string; systemPrompt: string }) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  const started = Date.now();
  const primary = process.env.OPENAI_INGESTION_MODEL?.trim() || prompt.model;
  const fallback = process.env.OPENAI_INGESTION_FALLBACK_MODEL?.trim();
  const models = [...new Set([primary, fallback].filter(Boolean) as string[])];
  let payload: Record<string, unknown> | null = null; let lastStatus = 0;
  for (const model of models) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model, store: false, instructions: prompt.systemPrompt, input: JSON.stringify({ title: document.title, body: document.body.slice(0, 24000), language: document.language, sourceUrl: document.sourceUrl }), text: { format: { type: "json_schema", name: "argentina_content_analysis", strict: true, schema } } }),
    });
    lastStatus = response.status;
    if (response.ok) { payload = await response.json() as Record<string, unknown>; break; }
    if (response.status < 500 && response.status !== 429) break;
  }
  if (!payload) throw new Error(`OPENAI_HTTP_${lastStatus}`);
  const text = outputText(payload);
  if (!text) throw new Error("OPENAI_EMPTY_STRUCTURED_OUTPUT");
  const analysis = JSON.parse(text) as AiIngestionAnalysis;
  const usage = (payload.usage ?? {}) as Record<string, unknown>;
  return { analysis, model: String(payload.model ?? primary), promptVersion: prompt.id, latencyMs: Date.now() - started, inputTokens: Number(usage.input_tokens ?? 0), outputTokens: Number(usage.output_tokens ?? 0), raw: { responseId: payload.id, status: payload.status, usedFallback: String(payload.model ?? primary) !== primary } as Json };
}
