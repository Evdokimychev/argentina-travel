import { executeSiteSearch } from "@/lib/search/search-query";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { GuideAssistantResponse, GuideAssistantSource } from "@/types/guide-assistant";

const RAG_LIMIT = 5;
const SNIPPET_MAX = 600;
const QUESTION_MAX = 500;

const CONTENT_KINDS = new Set(["guide", "blog", "immigration", "faq"]);

export const GUIDE_ASSISTANT_SYSTEM_PROMPT = `Ты — помощник сайта «Пора в Аргентину». Отвечай на русском языке: грамотно, понятно и по делу.

Правила:
- Опирайся только на переданные фрагменты материалов сайта. Не выдумывай факты.
- Если информации недостаточно — честно скажи об этом и предложи уточнить вопрос или открыть указанные материалы.
- В конце ответа перечисли источники в формате «Источники:» с названиями статей.
- По темам виз, иммиграции, гражданства, налогов и юридических правил обязательно добавь: «Правила меняются — уточняйте перед поездкой или обращением в консульство.»
- Не давай медицинских или юридических консультаций — только обобщай материалы сайта.
- Тон: живой, дружелюбный, без канцелярита и SEO-штампов.`;

type RagSnippetRow = {
  id: string;
  title: string;
  url: string;
  kind: string;
  body_text: string;
  description: string | null;
};

function truncateSnippet(text: string, max = SNIPPET_MAX): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trim()}…`;
}

export function isGuideAssistantAiConfigured(): boolean {
  return Boolean(
    process.env.OPENAI_API_KEY?.trim() || process.env.ANTHROPIC_API_KEY?.trim()
  );
}

function resolveAiProvider(): "openai" | "anthropic" | null {
  const preferred = process.env.GUIDE_ASSISTANT_PROVIDER?.trim().toLowerCase();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (preferred === "anthropic" && anthropicKey) return "anthropic";
  if (preferred === "openai" && openaiKey) return "openai";
  if (openaiKey) return "openai";
  if (anthropicKey) return "anthropic";
  return null;
}

async function fetchBodyTextByIds(ids: string[]): Promise<Map<string, RagSnippetRow>> {
  if (ids.length === 0 || !isSupabaseConfigured()) return new Map();

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("search_documents")
      .select("id, title, url, kind, body_text, description")
      .in("id", ids);

    if (error || !data) return new Map();

    return new Map(
      data.map((row) => [
        row.id,
        {
          id: row.id,
          title: row.title,
          url: row.url,
          kind: row.kind,
          body_text: row.body_text ?? "",
          description: row.description,
        },
      ])
    );
  } catch {
    return new Map();
  }
}

export async function fetchGuideRagSources(question: string): Promise<GuideAssistantSource[]> {
  const trimmed = question.trim().slice(0, QUESTION_MAX);
  if (!trimmed) return [];

  const search = await executeSiteSearch(trimmed, { limit: RAG_LIMIT * 2 });
  const prioritized = [
    ...search.results.filter((hit) => CONTENT_KINDS.has(hit.kind)),
    ...search.results.filter((hit) => !CONTENT_KINDS.has(hit.kind)),
  ];

  const uniqueHits = new Map<string, (typeof search.results)[number]>();
  for (const hit of prioritized) {
    if (!uniqueHits.has(hit.id)) uniqueHits.set(hit.id, hit);
    if (uniqueHits.size >= RAG_LIMIT) break;
  }

  const hits = [...uniqueHits.values()];
  const bodyMap = await fetchBodyTextByIds(hits.map((hit) => hit.id));

  return hits.map((hit) => {
    const row = bodyMap.get(hit.id);
    const raw =
      row?.body_text?.trim() ||
      row?.description?.trim() ||
      hit.description?.trim() ||
      "";
    return {
      id: hit.id,
      title: hit.title,
      url: hit.url,
      kind: hit.kind,
      snippet: truncateSnippet(raw || hit.title),
    };
  });
}

function buildContextBlock(sources: GuideAssistantSource[]): string {
  if (sources.length === 0) {
    return "Фрагменты материалов не найдены.";
  }

  return sources
    .map(
      (source, index) =>
        `[${index + 1}] «${source.title}» (${source.url})\n${source.snippet}`
    )
    .join("\n\n");
}

function buildSearchFallbackAnswer(
  question: string,
  sources: GuideAssistantSource[]
): string {
  if (sources.length === 0) {
    return `К сожалению, по запросу «${question}» на сайте не нашлось подходящих материалов. Попробуйте переформулировать вопрос или воспользуйтесь поиском по сайту.`;
  }

  const list = sources
    .map(
      (source, index) =>
        `${index + 1}. **${source.title}** — ${source.snippet.slice(0, 180)}${source.snippet.length > 180 ? "…" : ""}`
    )
    .join("\n");

  return `ИИ-помощник сейчас недоступен, но по вашему вопросу мы нашли материалы на сайте:\n\n${list}\n\nОткройте ссылки ниже — там есть подробности. Если нужен точный ответ по визам или иммиграции, уточняйте правила перед поездкой.`;
}

async function callOpenAi(system: string, user: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 900,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI error ${response.status}: ${detail.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI returned empty response");
  return text;
}

async function callAnthropic(system: string, user: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const model =
    process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-haiku-20241022";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Anthropic error ${response.status}: ${detail.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const text = payload.content
    ?.filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("")
    .trim();

  if (!text) throw new Error("Anthropic returned empty response");
  return text;
}

async function generateAiAnswer(question: string, sources: GuideAssistantSource[]): Promise<string> {
  const provider = resolveAiProvider();
  if (!provider) throw new Error("No AI provider configured");

  const userPrompt = `Вопрос пользователя: ${question}

Фрагменты материалов сайта:
${buildContextBlock(sources)}

Ответь на вопрос, опираясь только на эти фрагменты.`;

  if (provider === "anthropic") {
    return callAnthropic(GUIDE_ASSISTANT_SYSTEM_PROMPT, userPrompt);
  }
  return callOpenAi(GUIDE_ASSISTANT_SYSTEM_PROMPT, userPrompt);
}

export function normalizeGuideQuestion(question: string): string {
  return question.trim().slice(0, QUESTION_MAX);
}

export async function askGuideAssistant(question: string): Promise<GuideAssistantResponse> {
  const normalized = normalizeGuideQuestion(question);
  const sources = await fetchGuideRagSources(normalized);
  const aiConfigured = isGuideAssistantAiConfigured();

  if (!normalized) {
    return {
      answer: "Введите вопрос — мы подберём материалы из путеводителя и раздела об иммиграции.",
      sources: [],
      mode: "search_fallback",
      aiConfigured,
    };
  }

  if (!aiConfigured) {
    return {
      answer: buildSearchFallbackAnswer(normalized, sources),
      sources,
      mode: "search_fallback",
      aiConfigured: false,
    };
  }

  try {
    const answer = await generateAiAnswer(normalized, sources);
    return {
      answer,
      sources,
      mode: "ai",
      aiConfigured: true,
    };
  } catch {
    return {
      answer: buildSearchFallbackAnswer(normalized, sources),
      sources,
      mode: "search_fallback",
      aiConfigured: true,
    };
  }
}
