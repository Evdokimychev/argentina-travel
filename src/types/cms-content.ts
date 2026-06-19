import type { LegalDocument, LegalSection } from "@/data/legal-content";

/** Document types supported by CMS v1.2 */
export type CmsDocType = "legal" | "blog";

export type CmsDocumentStatus = "draft" | "published" | "archived";

export type CmsLegalBody = {
  kind: "legal";
  description: string;
  sections: LegalSection[];
};

export type CmsBlogBody = {
  kind: "blog";
  excerpt?: string;
  sections?: { title: string; body: string }[];
  content?: string;
};

export type CmsDocumentBody = CmsLegalBody | CmsBlogBody;

export type CmsDocumentSeo = {
  description?: string;
  title?: string;
};

export type CmsDocument = {
  id: string;
  docType: CmsDocType;
  slug: string;
  locale: string;
  title: string;
  status: CmsDocumentStatus;
  body: CmsDocumentBody;
  seo: CmsDocumentSeo;
  publishedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CmsRevision = {
  id: string;
  documentId: string;
  revisionNumber: number;
  title: string;
  body: CmsDocumentBody;
  seo: CmsDocumentSeo;
  createdBy: string | null;
  createdAt: string;
};

export function cmsDocumentId(docType: CmsDocType, slug: string, locale = "ru"): string {
  return `${docType}:${slug}:${locale}`;
}

export function parseCmsDocumentId(id: string): { docType: string; slug: string; locale: string } | null {
  const parts = id.split(":");
  if (parts.length < 2) return null;
  const docType = parts[0];
  const locale = parts.length >= 3 ? parts[parts.length - 1] : "ru";
  const slug = parts.slice(1, parts.length >= 3 ? -1 : undefined).join(":");
  return { docType, slug, locale };
}

export function legalDocumentFromCms(doc: CmsDocument): LegalDocument | null {
  if (doc.body.kind !== "legal") return null;
  return {
    slug: doc.slug,
    title: doc.title,
    description: doc.body.description,
    updatedAt: doc.publishedAt?.slice(0, 10) ?? doc.updatedAt.slice(0, 10),
    sections: doc.body.sections,
  };
}

export function legalBodyFromTs(source: LegalDocument): CmsLegalBody {
  return {
    kind: "legal",
    description: source.description,
    sections: source.sections,
  };
}
