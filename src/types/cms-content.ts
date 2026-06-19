import type { LegalDocument, LegalSection } from "@/data/legal-content";
import type { BlogPost } from "@/types";
import { formatBlogReadTime } from "@/lib/blog-utils";

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
  featured?: boolean;
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

export function blogBodyFromTs(source: BlogPost): CmsBlogBody {
  return {
    kind: "blog",
    excerpt: source.excerpt,
    sections: source.sections,
    content: source.content,
    featured: source.featured,
  };
}

export function blogPostFromCms(doc: CmsDocument, fallback?: BlogPost): BlogPost | null {
  if (doc.body.kind !== "blog") return null;

  const sections = doc.body.sections ?? fallback?.sections;
  const content =
    doc.body.content?.trim() ||
    (sections?.map((s) => `${s.title}\n\n${s.body}`).join("\n\n") ?? "") ||
    fallback?.content ||
    "";

  const readTimeMinutes =
    fallback?.readTimeMinutes ??
    Math.max(3, Math.ceil(content.split(/\s+/).filter(Boolean).length / 180));

  return {
    id: fallback?.id ?? doc.id,
    slug: doc.slug,
    title: doc.title,
    seoTitle: doc.seo.title ?? fallback?.seoTitle ?? doc.title,
    excerpt: doc.body.excerpt ?? fallback?.excerpt ?? "",
    content,
    sections,
    author: fallback?.author ?? "Редакция",
    authorBio: fallback?.authorBio,
    authorAvatar: fallback?.authorAvatar,
    date: doc.publishedAt?.slice(0, 10) ?? fallback?.date ?? doc.updatedAt.slice(0, 10),
    image: fallback?.image ?? "/logo-light.svg",
    category: fallback?.category ?? "Статья",
    readTime: fallback?.readTime ?? formatBlogReadTime(readTimeMinutes),
    readTimeMinutes,
    views: fallback?.views ?? 0,
    tags: fallback?.tags ?? [],
    featured: doc.body.featured ?? fallback?.featured,
    editorialReviewed: fallback?.editorialReviewed,
    relatedResources: fallback?.relatedResources,
    tourEmbeds: fallback?.tourEmbeds,
  };
}
