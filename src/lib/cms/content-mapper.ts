import type { Database, Json } from "@/types/database";
import type {
  CmsDocument,
  CmsDocumentBody,
  CmsDocumentSeo,
  CmsDocumentStatus,
  CmsRevision,
} from "@/types/cms-content";
import type { LegalSection } from "@/data/legal-content";
import { parseCmsBlogSection, parseCmsGuideSection } from "@/lib/cms/page-builder/block-normalize";

type ContentDocumentRow = Database["public"]["Tables"]["content_documents"]["Row"];
type ContentRevisionRow = Database["public"]["Tables"]["content_revisions"]["Row"];

function parseBody(value: Json): CmsDocumentBody {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { kind: "legal", description: "", sections: [] };
  }
  const record = value as Record<string, unknown>;
  const stringArray = (input: unknown): string[] | undefined =>
    Array.isArray(input) ? input.filter((item): item is string => typeof item === "string") : undefined;
  const parseCollector = (input: unknown) => {
    if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
    const collector = input as Record<string, unknown>;
    if (typeof collector.identity !== "string" || typeof collector.fingerprint !== "string") {
      return undefined;
    }
    const scoreBreakdown =
      collector.scoreBreakdown && typeof collector.scoreBreakdown === "object" && !Array.isArray(collector.scoreBreakdown)
        ? Object.fromEntries(
            Object.entries(collector.scoreBreakdown as Record<string, unknown>).filter(
              (entry): entry is [string, number] => typeof entry[1] === "number"
            )
          )
        : {};
    return {
      schemaVersion: typeof collector.schemaVersion === "number" ? collector.schemaVersion : 2,
      identity: collector.identity,
      source: typeof collector.source === "string" ? collector.source : "unknown",
      sourceId: typeof collector.sourceId === "string" ? collector.sourceId : "unknown",
      sourceItemId:
        typeof collector.sourceItemId === "string" || typeof collector.sourceItemId === "number"
          ? collector.sourceItemId
          : null,
      sourceUrl: typeof collector.sourceUrl === "string" ? collector.sourceUrl : undefined,
      fingerprint: collector.fingerprint,
      qualityScore: typeof collector.qualityScore === "number" ? collector.qualityScore : 0,
      scoreBreakdown,
      flags: stringArray(collector.flags) ?? [],
      category: typeof collector.category === "string" ? collector.category : undefined,
      province: typeof collector.province === "string" ? collector.province : undefined,
      city: typeof collector.city === "string" ? collector.city : undefined,
      tags: stringArray(collector.tags) ?? [],
      media: stringArray(collector.media) ?? [],
      collectedAt: typeof collector.collectedAt === "string" ? collector.collectedAt : undefined,
    };
  };
  if (record.kind === "blog") {
    return {
      kind: "blog",
      excerpt: typeof record.excerpt === "string" ? record.excerpt : undefined,
      content: typeof record.content === "string" ? record.content : undefined,
      featured: typeof record.featured === "boolean" ? record.featured : undefined,
      relatedDestinations: stringArray(record.relatedDestinations),
      sections: Array.isArray(record.sections)
        ? record.sections.map((section) => parseCmsBlogSection(section))
        : undefined,
      collector: parseCollector(record.collector),
      authorName: typeof record.authorName === "string" ? record.authorName : undefined,
      authorSlug: typeof record.authorSlug === "string" ? record.authorSlug : undefined,
      authorBio: typeof record.authorBio === "string" ? record.authorBio : undefined,
      authorAvatar: typeof record.authorAvatar === "string" ? record.authorAvatar : undefined,
      personalExperience:
        typeof record.personalExperience === "boolean" ? record.personalExperience : undefined,
      verifiedByAuthor:
        typeof record.verifiedByAuthor === "boolean" ? record.verifiedByAuthor : undefined,
    };
  }
  if (record.kind === "author_article") {
    return {
      kind: "author_article",
      excerpt: typeof record.excerpt === "string" ? record.excerpt : undefined,
      authorName: typeof record.authorName === "string" ? record.authorName : undefined,
      sections: Array.isArray(record.sections)
        ? record.sections.map((section) => parseCmsBlogSection(section))
        : undefined,
    };
  }
  if (record.kind === "guide") {
    return {
      kind: "guide",
      description: typeof record.description === "string" ? record.description : "",
      category: typeof record.category === "string" ? record.category : undefined,
      sections: Array.isArray(record.sections)
        ? record.sections.map((section) => parseCmsGuideSection(section))
        : [],
      relatedLinks: Array.isArray(record.relatedLinks)
        ? (record.relatedLinks as { label: string; href: string; description?: string }[])
        : undefined,
      relatedTourQuery: typeof record.relatedTourQuery === "string" ? record.relatedTourQuery : undefined,
    };
  }
  if (record.kind === "landing") {
    return {
      kind: "landing",
      description: typeof record.description === "string" ? record.description : "",
      category: typeof record.category === "string" ? record.category : undefined,
      sections: Array.isArray(record.sections)
        ? record.sections.map((section) => parseCmsGuideSection(section))
        : [],
      relatedLinks: Array.isArray(record.relatedLinks)
        ? (record.relatedLinks as { label: string; href: string; description?: string }[])
        : undefined,
      relatedTourQuery: typeof record.relatedTourQuery === "string" ? record.relatedTourQuery : undefined,
    };
  }
  if (record.kind === "destination") {
    return {
      kind: "destination",
      description: typeof record.description === "string" ? record.description : "",
      intro: typeof record.intro === "string" ? record.intro : undefined,
      regionGroup: typeof record.regionGroup === "string" ? record.regionGroup : undefined,
      bestSeason: typeof record.bestSeason === "string" ? record.bestSeason : undefined,
      idealDuration: typeof record.idealDuration === "string" ? record.idealDuration : undefined,
      howToGetThere: typeof record.howToGetThere === "string" ? record.howToGetThere : undefined,
      highlights: stringArray(record.highlights),
      travelTips: stringArray(record.travelTips),
      sections: Array.isArray(record.sections)
        ? record.sections.map((section) => parseCmsGuideSection(section))
        : undefined,
    };
  }
  if (record.kind === "place") {
    return {
      kind: "place",
      shortDescription: typeof record.shortDescription === "string" ? record.shortDescription : "",
      fullDescription: typeof record.fullDescription === "string" ? record.fullDescription : "",
      howToGetThere: typeof record.howToGetThere === "string" ? record.howToGetThere : undefined,
      interestingFacts: stringArray(record.interestingFacts),
      faq: Array.isArray(record.faq)
        ? (record.faq as { question: string; answer: string }[])
        : undefined,
      relatedTourSlugs: stringArray(record.relatedTourSlugs),
      sections: Array.isArray(record.sections)
        ? record.sections.map((section) => parseCmsGuideSection(section))
        : undefined,
    };
  }
  return {
    kind: "legal",
    description: typeof record.description === "string" ? record.description : "",
    sections: Array.isArray(record.sections) ? (record.sections as LegalSection[]) : [],
  };
}

function parseSeo(value: Json): CmsDocumentSeo {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    description: typeof record.description === "string" ? record.description : undefined,
    title: typeof record.title === "string" ? record.title : undefined,
    image: typeof record.image === "string" ? record.image : undefined,
    canonical: typeof record.canonical === "string" ? record.canonical : undefined,
    noIndex: typeof record.noIndex === "boolean" ? record.noIndex : undefined,
  };
}

function parseStatus(value: string): CmsDocumentStatus {
  if (value === "published" || value === "archived" || value === "scheduled") return value;
  return "draft";
}

export function rowToCmsDocument(row: ContentDocumentRow): CmsDocument {
  return {
    id: row.id,
    docType: row.doc_type as CmsDocument["docType"],
    slug: row.slug,
    locale: row.locale,
    title: row.title,
    status: parseStatus(row.status),
    body: parseBody(row.body),
    seo: parseSeo(row.seo),
    publishedAt: row.published_at,
    scheduledPublishAt: row.scheduled_publish_at ?? null,
    workflowStage: row.workflow_stage as CmsDocument["workflowStage"],
    riskLevel: row.risk_level as CmsDocument["riskLevel"],
    reviewerId: row.reviewer_id,
    lastFactCheckedAt: row.last_fact_checked_at,
    nextReviewAt: row.next_review_at,
    lastSubstantiveUpdateAt: row.last_substantive_update_at,
    schemaVersion: row.schema_version,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    rowVersion: row.row_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToCmsRevision(row: ContentRevisionRow): CmsRevision {
  return {
    id: row.id,
    documentId: row.document_id,
    revisionNumber: row.revision_number,
    title: row.title,
    body: parseBody(row.body),
    seo: parseSeo(row.seo),
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function cmsDocumentToRow(
  doc: Pick<
    CmsDocument,
    | "id"
    | "docType"
    | "slug"
    | "locale"
    | "title"
    | "status"
    | "body"
    | "seo"
    | "publishedAt"
    | "scheduledPublishAt"
    | "workflowStage"
    | "riskLevel"
    | "reviewerId"
    | "lastFactCheckedAt"
    | "nextReviewAt"
    | "lastSubstantiveUpdateAt"
    | "schemaVersion"
  > & { createdBy?: string | null; updatedBy?: string | null }
): Database["public"]["Tables"]["content_documents"]["Insert"] {
  return {
    id: doc.id,
    doc_type: doc.docType,
    slug: doc.slug,
    locale: doc.locale,
    title: doc.title,
    status: doc.status,
    body: doc.body as Json,
    seo: doc.seo as Json,
    published_at: doc.publishedAt,
    scheduled_publish_at: doc.scheduledPublishAt ?? null,
    workflow_stage: doc.workflowStage ?? "draft",
    risk_level: doc.riskLevel ?? "low",
    reviewer_id: doc.reviewerId ?? null,
    last_fact_checked_at: doc.lastFactCheckedAt ?? null,
    next_review_at: doc.nextReviewAt ?? null,
    last_substantive_update_at: doc.lastSubstantiveUpdateAt ?? null,
    schema_version: doc.schemaVersion ?? 1,
    created_by: doc.createdBy ?? null,
    updated_by: doc.updatedBy ?? null,
  };
}
