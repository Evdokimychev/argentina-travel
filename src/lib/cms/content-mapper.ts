import type { Database, Json } from "@/types/database";
import type {
  CmsDocument,
  CmsDocumentBody,
  CmsDocumentSeo,
  CmsDocumentStatus,
  CmsRevision,
} from "@/types/cms-content";
import type { LegalSection } from "@/data/legal-content";

type ContentDocumentRow = Database["public"]["Tables"]["content_documents"]["Row"];
type ContentRevisionRow = Database["public"]["Tables"]["content_revisions"]["Row"];

function parseBody(value: Json): CmsDocumentBody {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { kind: "legal", description: "", sections: [] };
  }
  const record = value as Record<string, unknown>;
  if (record.kind === "blog") {
    return {
      kind: "blog",
      excerpt: typeof record.excerpt === "string" ? record.excerpt : undefined,
      content: typeof record.content === "string" ? record.content : undefined,
      sections: Array.isArray(record.sections)
        ? (record.sections as { title: string; body: string }[])
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
