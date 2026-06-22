import type {
  Article,
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
  | ItemList
  | Trip
  | TouristDestination
>;

export function serializeJsonLd(data: JsonLdGraph | JsonLdGraph[]): string {
  return JSON.stringify(data);
}

export function buildOrganizationSchema(input: {
  name: string;
  url: string;
  logoUrl: string;
  sameAs?: string[];
}): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: input.url,
    logo: input.logoUrl,
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
  };
}

export function buildWebSiteSchema(input: {
  name: string;
  url: string;
  searchUrlTemplate: string;
}): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: input.url,
    inLanguage: "ru-RU",
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

export function buildArticleSchema(input: {
  title: string;
  excerpt: string;
  slug: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  publisherName?: string;
}): WithContext<Article> {
  const imageUrl = input.image ? resolvePublicUrl(input.image) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.excerpt,
    url: absoluteUrl(`/blog/${input.slug}`),
    ...(imageUrl ? { image: imageUrl } : {}),
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    inLanguage: "ru",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [...BLOG_SPEAKABLE_CSS_SELECTORS],
    },
    author: {
      "@type": "Organization",
      name: input.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: input.publisherName ?? DEFAULT_SITE_BRANDING.siteName,
    },
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
