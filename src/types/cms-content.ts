import type { LegalDocument, LegalSection } from "@/data/legal-content";
import type { ContentPage, ContentRelatedLink, ContentSection } from "@/types/content-page";
import type { BlogPost } from "@/types";
import type { DestinationPage } from "@/data/destination-pages";
import type { PlaceDetail, PlaceFaqItem } from "@/types/place";
import { formatBlogReadTime } from "@/lib/blog-utils";
import { resolveBlogPostCardImage } from "@/lib/media-resolver";

/** Document types supported by CMS v1.4 */
export type CmsDocType =
  | "legal"
  | "blog"
  | "guide"
  | "destination"
  | "place"
  | "author_article";

export type CmsDocumentStatus = "draft" | "scheduled" | "published" | "archived";

export type CmsLegalBody = {
  kind: "legal";
  description: string;
  sections: LegalSection[];
};

import type { BlogBodyBlock, BlogSectionKind } from "@/types/blog-content-blocks";

export type CmsBlogSection = {
  title: string;
  body: string;
  blockType?: BlogSectionKind;
  blocks?: BlogBodyBlock[];
};

export type CmsBlogBody = {
  kind: "blog";
  excerpt?: string;
  sections?: CmsBlogSection[];
  content?: string;
  featured?: boolean;
  relatedDestinations?: string[];
};

export type CmsGuideBody = {
  kind: "guide";
  description: string;
  category?: string;
  sections: ContentSection[];
  relatedLinks?: ContentRelatedLink[];
  relatedTourQuery?: string;
};

export type CmsDestinationBody = {
  kind: "destination";
  description: string;
  intro?: string;
  regionGroup?: string;
  bestSeason?: string;
  idealDuration?: string;
  howToGetThere?: string;
  highlights?: string[];
  travelTips?: string[];
};

export type CmsPlaceBody = {
  kind: "place";
  shortDescription: string;
  fullDescription: string;
  howToGetThere?: string;
  interestingFacts?: string[];
  faq?: PlaceFaqItem[];
  relatedTourSlugs?: string[];
};

export type CmsAuthorArticleBody = {
  kind: "author_article";
  excerpt?: string;
  authorName?: string;
  sections?: CmsBlogSection[];
};

export type CmsDocumentBody =
  | CmsLegalBody
  | CmsBlogBody
  | CmsGuideBody
  | CmsDestinationBody
  | CmsPlaceBody
  | CmsAuthorArticleBody;

export type CmsDocumentSeo = {
  description?: string;
  title?: string;
  /** OG / meta image — localPath, /media/... or absolute URL */
  image?: string;
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
  /** Set when status=scheduled; auto-publish via cron at this time (UTC). */
  scheduledPublishAt: string | null;
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
    relatedDestinations: source.relatedDestinations,
  };
}

export function guideBodyFromTs(source: ContentPage): CmsGuideBody {
  return {
    kind: "guide",
    description: source.description,
    category: source.category,
    sections: source.sections,
    relatedLinks: source.relatedLinks,
    relatedTourQuery: source.relatedTourQuery,
  };
}

export function destinationBodyFromTs(source: DestinationPage): CmsDestinationBody {
  return {
    kind: "destination",
    description: source.description,
    intro: source.intro,
    regionGroup: source.regionGroup,
    bestSeason: source.bestSeason,
    idealDuration: source.idealDuration,
    howToGetThere: source.howToGetThere,
    highlights: source.highlights,
    travelTips: source.travelTips,
  };
}

export function placeBodyFromTs(
  source: Pick<
    PlaceDetail,
    "shortDescription" | "fullDescription" | "howToGetThere" | "interestingFacts" | "faq"
  >
): CmsPlaceBody {
  return {
    kind: "place",
    shortDescription: source.shortDescription,
    fullDescription: source.fullDescription,
    howToGetThere: source.howToGetThere,
    interestingFacts: source.interestingFacts,
    faq: source.faq,
    relatedTourSlugs: (source as { relatedTourSlugs?: string[] }).relatedTourSlugs,
  };
}

export function authorArticleFromCms(doc: CmsDocument, fallback?: BlogPost): BlogPost | null {
  if (doc.body.kind !== "author_article") return null;

  const blogDoc: CmsDocument = {
    ...doc,
    body: {
      kind: "blog",
      excerpt: doc.body.excerpt,
      sections: doc.body.sections,
    },
  };

  const post = blogPostFromCms(blogDoc, fallback);
  if (!post) return null;

  return {
    ...post,
    author: doc.body.authorName?.trim() || post.author,
    category: "Эксперт",
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

  const draft: BlogPost = {
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
    image: doc.seo.image ?? fallback?.image ?? "/logo-light.svg",
    category: fallback?.category ?? "Статья",
    readTime: fallback?.readTime ?? formatBlogReadTime(readTimeMinutes),
    readTimeMinutes,
    tags: fallback?.tags ?? [],
    featured: doc.body.featured ?? fallback?.featured,
    editorialReviewed: fallback?.editorialReviewed,
    noIndex: fallback?.noIndex,
    canonicalSlug: fallback?.canonicalSlug,
    dateModified: fallback?.dateModified,
    richArticleId: fallback?.richArticleId,
    relatedResources: fallback?.relatedResources,
    relatedDestinations: doc.body.relatedDestinations ?? fallback?.relatedDestinations,
    tourEmbeds: fallback?.tourEmbeds,
  };

  return { ...draft, image: resolveBlogPostCardImage(draft) };
}

export function guidePageFromCms(doc: CmsDocument, fallback?: ContentPage): ContentPage | null {
  if (doc.body.kind !== "guide") return null;

  return {
    slug: doc.slug,
    section: "guide",
    title: doc.title,
    description: doc.body.description || fallback?.description || "",
    category: doc.body.category || fallback?.category || "Путеводитель",
    updatedAt: doc.publishedAt?.slice(0, 10) ?? doc.updatedAt.slice(0, 10),
    sections: doc.body.sections.length ? doc.body.sections : (fallback?.sections ?? []),
    relatedLinks: doc.body.relatedLinks ?? fallback?.relatedLinks,
    relatedTourQuery: doc.body.relatedTourQuery ?? fallback?.relatedTourQuery,
  };
}

export function destinationPageFromCms(
  doc: CmsDocument,
  fallback?: DestinationPage
): DestinationPage | null {
  if (doc.body.kind !== "destination") return null;

  const description = doc.body.description || fallback?.description || doc.body.intro || "";
  const intro = doc.body.intro || fallback?.intro || description;
  const regionGroup = doc.body.regionGroup || fallback?.regionGroup || fallback?.region || "Аргентина";
  const keywords = fallback?.keywords?.length
    ? fallback.keywords
    : [doc.slug.replace(/-/g, " "), doc.title];

  return {
    id: doc.slug,
    name: doc.title,
    region: fallback?.region ?? regionGroup,
    description,
    image: fallback?.image ?? "/logo-light.svg",
    imageAlt: fallback?.imageAlt,
    gallery: fallback?.gallery,
    keywords,
    intro,
    highlights: doc.body.highlights ?? fallback?.highlights ?? [],
    bestSeason: doc.body.bestSeason || fallback?.bestSeason || "Уточняйте перед поездкой",
    idealDuration: doc.body.idealDuration || fallback?.idealDuration || "3-5 дней",
    howToGetThere:
      doc.body.howToGetThere ||
      fallback?.howToGetThere ||
      "Уточняйте логистику и трансферы перед поездкой.",
    travelTips: doc.body.travelTips ?? fallback?.travelTips ?? [],
    regionGroup,
  };
}

export function placeDetailFromCms(doc: CmsDocument, fallback?: PlaceDetail): PlaceDetail | null {
  if (doc.body.kind !== "place") return null;

  const coverImage = fallback?.coverImage ?? "/logo-light.svg";
  const gallery = fallback?.gallery?.length ? fallback.gallery : [coverImage];
  const shortDescription =
    doc.body.shortDescription || fallback?.shortDescription || doc.body.fullDescription || "";
  const fullDescription = doc.body.fullDescription || fallback?.fullDescription || shortDescription;

  return {
    id: fallback?.id ?? `cms-place-${doc.slug}`,
    slug: doc.slug,
    name: doc.title,
    shortDescription,
    category: fallback?.category ?? "city",
    region: fallback?.region ?? "Аргентина",
    province: fallback?.province,
    city: fallback?.city,
    latitude: fallback?.latitude ?? -34.6037,
    longitude: fallback?.longitude ?? -58.3816,
    coverImage,
    tags: fallback?.tags ?? [],
    rating: fallback?.rating,
    visitDuration: fallback?.visitDuration,
    season: fallback?.season,
    ticketPrice: fallback?.ticketPrice,
    popularity: fallback?.popularity ?? 50,
    fullDescription,
    gallery,
    website: fallback?.website,
    source: fallback?.source ?? "manual",
    relatedPlaces: fallback?.relatedPlaces ?? [],
    collections: fallback?.collections ?? [],
    itineraryReferences: fallback?.itineraryReferences ?? [],
    history: fallback?.history,
    interestingFacts: doc.body.interestingFacts ?? fallback?.interestingFacts,
    howToGetThere: doc.body.howToGetThere ?? fallback?.howToGetThere,
    nearbyHighlights: fallback?.nearbyHighlights,
    faq: doc.body.faq ?? fallback?.faq,
    relatedTourSlugs: doc.body.relatedTourSlugs ?? fallback?.relatedTourSlugs,
  };
}
