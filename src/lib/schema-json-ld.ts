import type {
  Article,
  Apartment,
  BreadcrumbList,
  FAQPage,
  ItemList,
  Organization,
  Trip,
  TouristDestination,
  WebPage,
  WebSite,
  WithContext,
} from "schema-dts";
import { DEFAULT_SITE_BRANDING } from "@/lib/cms/site-globals/normalize";
import { absoluteUrl, resolvePublicUrl } from "@/lib/site-url";

export type JsonLdGraph = WithContext<
  | Organization
  | WebSite
  | WebPage
  | FAQPage
  | BreadcrumbList
  | Article
  | Apartment
  | ItemList
  | Trip
  | TouristDestination
>;

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export const ORGANIZATION_SCHEMA_ID = "#organization";

export function organizationSchemaId(siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, "")}${ORGANIZATION_SCHEMA_ID}`;
}

/** Tours catalog search — used in WebSite SearchAction (Google site name; optional for Yandex). */
export function buildSiteSearchUrlTemplate(siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}/tours?query={search_term_string}`;
}

export function buildOrganizationSchema(input: {
  name: string;
  url: string;
  logoUrl: string;
  sameAs?: string[];
  contactEmail?: string;
}): WithContext<Organization> {
  const orgId = organizationSchemaId(input.url);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": orgId,
    name: input.name,
    url: input.url,
    logo: input.logoUrl,
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
    ...(input.contactEmail
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: input.contactEmail,
            availableLanguage: ["Russian"],
          },
        }
      : {}),
  };
}

export function buildWebSiteSchema(input: {
  name: string;
  url: string;
  searchUrlTemplate: string;
  publisherId?: string;
}): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: input.url,
    inLanguage: "ru-RU",
    ...(input.publisherId ? { publisher: { "@id": input.publisherId } } : {}),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: input.searchUrlTemplate,
      },
      "query-input": "required name=search_term_string",
    } as WebSite["potentialAction"],
  };
}

export function buildWebPageSchema(input: {
  name: string;
  description: string;
  path: string;
}): WithContext<WebPage> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
  };
}

export function buildFaqPageSchema(input: {
  path: string;
  questions: Array<{ question: string; answer: string }>;
}): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: absoluteUrl(input.path),
    mainEntity: input.questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbListSchema(
  items: Array<{ name: string; path: string }>
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** CSS selectors for Google speakable (must match blog post markup). */
export const BLOG_SPEAKABLE_CSS_SELECTORS = [
  "[data-speakable='headline']",
  "[data-speakable='lede']",
] as const;

export type ArticleSchemaType = "Article" | "BlogPosting" | "NewsArticle";

export function buildArticleSchema(input: {
  title: string;
  description: string;
  path: string;
  /** Full article body — required for Yandex Metrika content analytics (JSON-LD `text`). */
  text: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName: string;
  authorAvatar?: string;
  publisherName?: string;
  schemaType?: ArticleSchemaType;
  about?: string[];
  /** Blog-only: Google speakable selectors */
  speakable?: boolean;
  /** @deprecated Prefer `path` */
  slug?: string;
  /** @deprecated Prefer `description` */
  excerpt?: string;
}): WithContext<Article> {
  const imageUrl = input.image ? resolvePublicUrl(input.image) : undefined;
  const authorAvatarUrl = input.authorAvatar ? resolvePublicUrl(input.authorAvatar) : undefined;
  const pagePath = input.path ?? `/blog/${input.slug ?? ""}`;
  const pageUrl = absoluteUrl(pagePath);
  const articleUrl = `${pageUrl}#article`;
  const publisherName = input.publisherName ?? DEFAULT_SITE_BRANDING.siteName;
  const schemaType = input.schemaType ?? "Article";
  const description = input.description.trim() || input.excerpt?.trim() || input.title;
  const text = input.text.trim() || description;

  return {
    "@context": "https://schema.org",
    "@type": schemaType,
    "@id": articleUrl,
    headline: input.title,
    description,
    text,
    url: articleUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(input.datePublished
      ? {
          datePublished: input.datePublished,
          dateModified: input.dateModified ?? input.datePublished,
        }
      : {}),
    inLanguage: "ru",
    ...(input.speakable
      ? {
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: [...BLOG_SPEAKABLE_CSS_SELECTORS],
          },
        }
      : {}),
    author: authorAvatarUrl
      ? {
          "@type": "Person",
          name: input.authorName,
          image: authorAvatarUrl,
        }
      : {
          "@type": "Organization",
          name: input.authorName,
        },
    publisher: {
      "@type": "Organization",
      "@id": organizationSchemaId(absoluteUrl("/")),
      name: publisherName,
      url: absoluteUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icons/icon-512.png"),
      },
    },
    ...(input.about?.length
      ? {
          about: input.about.map((name) => ({
            "@type": "Thing" as const,
            name,
          })),
        }
      : {}),
  };
}

export function buildTouristDestinationSchema(input: {
  name: string;
  description: string;
  path: string;
  image?: string;
}): WithContext<TouristDestination> {
  const imageUrl = input.image ? resolvePublicUrl(input.image) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    ...(imageUrl ? { image: imageUrl } : {}),
    touristType: "Leisure",
  };
}
