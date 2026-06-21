import type { Database, Json } from "@/types/database";
import type {
  CmsDocument,
  CmsDocumentBody,
  CmsDocumentSeo,
  CmsDocumentStatus,
  CmsRevision,
} from "@/types/cms-content";
import type { LegalSection } from "@/data/legal-content";
import { parseCmsBlogSection } from "@/lib/cms/page-builder/block-normalize";

type ContentDocumentRow = Database["public"]["Tables"]["content_documents"]["Row"];
type ContentRevisionRow = Database["public"]["Tables"]["content_revisions"]["Row"];

function parseBody(value: Json): CmsDocumentBody {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { kind: "legal", description: "", sections: [] };
  }
  const record = value as Record<string, unknown>;
  const stringArray = (input: unknown): string[] | undefined =>
    Array.isArray(input) ? input.filter((item): item is string => typeof item === "string") : undefined;
  if (record.kind === "blog") {
    return {
      kind: "blog",
      excerpt: typeof record.excerpt === "string" ? record.excerpt : undefined,
      content: typeof record.content === "string" ? record.content : undefined,
      featured: typeof record.featured === "boolean" ? record.featured : undefined,
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
      sections: Array.isArray(record.sections) ? (record.sections as LegalSection[]) : [],
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
  };
}

function parseStatus(value: string): CmsDocumentStatus {
  if (value === "published" || value === "archived") return value;
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
    createdBy: row.created_by,
    updatedBy: row.updated_by,
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
    "id" | "docType" | "slug" | "locale" | "title" | "status" | "body" | "seo" | "publishedAt"
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
    created_by: doc.createdBy ?? null,
    updated_by: doc.updatedBy ?? null,
  };
}
