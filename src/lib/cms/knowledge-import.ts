import type {
  CmsBlogBody,
  CmsCollectorProvenance,
  CmsDocumentSeo,
} from "@/types/cms-content";

export const KNOWLEDGE_PACKAGE_SCHEMA = "argentina-travel-knowledge-v2";
const MAX_CANDIDATES = 500;
const MAX_CONTENT_LENGTH = 250_000;

export type KnowledgeCandidate = {
  id: string;
  fingerprint: string;
  slug: string;
  locale: string;
  title: string;
  summary: string;
  body: CmsBlogBody;
  seo: CmsDocumentSeo;
  editorialStatus: "review" | "accepted" | "ready";
  createdAt?: string;
  editorial: CmsCollectorProvenance;
};

export type KnowledgePackage = {
  schema: typeof KNOWLEDGE_PACKAGE_SCHEMA;
  exportId: string;
  generatedAt: string;
  producer: string;
  candidates: KnowledgeCandidate[];
};

export type KnowledgePackageError = {
  index?: number;
  id?: string;
  message: string;
};

export function parseKnowledgePackage(input: unknown): {
  value: KnowledgePackage | null;
  errors: KnowledgePackageError[];
} {
  if (!isRecord(input)) {
    return { value: null, errors: [{ message: "Пакет должен быть JSON-объектом" }] };
  }
  if (input.schema !== KNOWLEDGE_PACKAGE_SCHEMA) {
    return {
      value: null,
      errors: [{ message: `Неподдерживаемая схема: ${String(input.schema ?? "не указана")}` }],
    };
  }
  if (!Array.isArray(input.articles)) {
    return { value: null, errors: [{ message: "В пакете отсутствует массив articles" }] };
  }
  if (input.articles.length > MAX_CANDIDATES) {
    return {
      value: null,
      errors: [{ message: `В одном пакете допускается не более ${MAX_CANDIDATES} материалов` }],
    };
  }

  const candidates: KnowledgeCandidate[] = [];
  const errors: KnowledgePackageError[] = [];
  input.articles.forEach((raw, index) => {
    const parsed = parseCandidate(raw);
    if ("error" in parsed) {
      errors.push({ index, id: isRecord(raw) && typeof raw.id === "string" ? raw.id : undefined, message: parsed.error });
    } else {
      candidates.push(parsed.candidate);
    }
  });

  return {
    value: {
      schema: KNOWLEDGE_PACKAGE_SCHEMA,
      exportId: text(input.export_id, "unknown-export", 120),
      generatedAt: text(input.generated_at, new Date(0).toISOString(), 80),
      producer: text(input.producer, "unknown", 120),
      candidates,
    },
    errors,
  };
}

function parseCandidate(raw: unknown): { candidate: KnowledgeCandidate } | { error: string } {
  if (!isRecord(raw)) return { error: "Материал должен быть JSON-объектом" };
  if (!isRecord(raw.body) || raw.body.kind !== "blog") return { error: "Поддерживается только body.kind=blog" };
  if (!isRecord(raw.body.collector)) return { error: "Не указано происхождение материала" };

  const id = text(raw.id, "", 240);
  const fingerprint = text(raw.fingerprint, "", 128);
  const title = text(raw.title, "", 180);
  const slug = text(raw.slug, "", 120).toLowerCase();
  const content = text(raw.body.content, "", MAX_CONTENT_LENGTH);
  const editorialStatus = raw.editorial_status;

  if (!id || !fingerprint || !title || !content) return { error: "Не заполнены id, fingerprint, title или body.content" };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { error: "Slug содержит недопустимые символы" };
  if (!(["review", "accepted", "ready"] as unknown[]).includes(editorialStatus)) {
    return { error: "Недопустимый editorial_status" };
  }

  const collector = parseCollector(raw.body.collector, id, fingerprint);
  const sections = Array.isArray(raw.body.sections)
    ? raw.body.sections
        .filter(isRecord)
        .map((section) => ({
          title: text(section.title, "Основное", 180),
          body: text(section.body, "", MAX_CONTENT_LENGTH),
        }))
        .filter((section) => section.body)
    : [];
  const summary = text(raw.summary, text(raw.body.excerpt, "", 500), 500);
  const seo = isRecord(raw.seo) ? raw.seo : {};

  return {
    candidate: {
      id,
      fingerprint,
      slug,
      locale: text(raw.locale, "ru", 8),
      title,
      summary,
      body: {
        kind: "blog",
        excerpt: summary,
        content,
        sections: sections.length ? sections : [{ title: "Основное", body: content }],
        collector,
      },
      seo: {
        description: text(seo.description, summary, 500),
        noIndex: true,
      },
      editorialStatus: editorialStatus as KnowledgeCandidate["editorialStatus"],
      createdAt: typeof raw.created_at === "string" ? raw.created_at : undefined,
      editorial: collector,
    },
  };
}

function parseCollector(raw: Record<string, unknown>, identity: string, fingerprint: string): CmsCollectorProvenance {
  const breakdown = isRecord(raw.scoreBreakdown)
    ? Object.fromEntries(Object.entries(raw.scoreBreakdown).filter((entry): entry is [string, number] => typeof entry[1] === "number"))
    : {};
  return {
    schemaVersion: number(raw.schemaVersion, 2),
    identity,
    source: text(raw.source, "unknown", 80),
    sourceId: text(raw.sourceId, "unknown", 180),
    sourceItemId: typeof raw.sourceItemId === "number" || typeof raw.sourceItemId === "string" ? raw.sourceItemId : null,
    sourceUrl: typeof raw.sourceUrl === "string" ? raw.sourceUrl.slice(0, 2000) : undefined,
    fingerprint,
    qualityScore: Math.max(0, Math.min(100, number(raw.qualityScore, 0))),
    scoreBreakdown: breakdown,
    flags: stringArray(raw.flags, 30),
    category: optionalText(raw.category, 80),
    province: optionalText(raw.province, 120),
    city: optionalText(raw.city, 120),
    tags: stringArray(raw.tags, 60),
    media: stringArray(raw.media, 50),
    collectedAt: optionalText(raw.collectedAt, 80),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, fallback: string, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : fallback;
}

function optionalText(value: unknown, maxLength: number): string | undefined {
  const valueText = text(value, "", maxLength);
  return valueText || undefined;
}

function number(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map((item) => item.slice(0, 500)).slice(0, limit);
}
