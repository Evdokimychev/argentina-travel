import type { DestinationPage } from "@/data/destination-pages";
import type { BlogPost } from "@/types";
import type { PlaceCollection, PlaceItinerary } from "@/types/place";
import type { ContentPage } from "@/types/content-page";
import type { GuidePillarContent } from "@/types/guide-pillar";
import type { GuideTopicPage } from "@/types/guide-topic";
import type { KbEntry } from "@/lib/knowledge-base/types";
import { destinationHref } from "@/lib/destinations";
import { collectionHref, itineraryHref, placeHref } from "@/lib/places-repository";
import {
  buildArticleSchema,
  buildFaqPageSchema,
  buildTouristDestinationSchema,
} from "@/lib/schema-json-ld";
import {
  blogPostPlainText,
  contentPagePlainText,
  guidePillarPlainText,
  guideTopicPlainText,
  kbEntryPlainText,
} from "@/lib/article-plain-text";
import { BLOG_EDITORIAL } from "@/data/blog-author";
import { getBlogUpdatedDate } from "@/lib/blog-utils";
import { contentPageHref } from "@/lib/content-pages";
import { guideTopicHref } from "@/lib/guide-topics";
import { entryHref } from "@/lib/knowledge-base/urls";
import { absoluteUrl, resolvePublicUrl } from "@/lib/site-url";

export function buildCollectionItemListJsonLd(collection: PlaceCollection) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: collection.title,
    description: collection.description,
    url: absoluteUrl(collectionHref(collection.slug)),
    numberOfItems: collection.places.length,
    itemListElement: collection.places.map((place, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "TouristAttraction",
        name: place.name,
        description: place.shortDescription,
        url: absoluteUrl(placeHref(place.slug)),
      },
    })),
  };
}

export function buildItineraryTripJsonLd(itinerary: PlaceItinerary) {
  const imageUrl = itinerary.coverImage ? resolvePublicUrl(itinerary.coverImage) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Trip",
    name: itinerary.title,
    description: itinerary.description,
    url: absoluteUrl(itineraryHref(itinerary.slug)),
    ...(imageUrl ? { image: imageUrl } : {}),
    itinerary: {
      "@type": "ItemList",
      numberOfItems: itinerary.stops.length,
      itemListElement: itinerary.stops.map((stop, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "TouristDestination",
          name: stop.title,
          ...(stop.place ? { url: absoluteUrl(placeHref(stop.place.slug)) } : {}),
        },
      })),
    },
  };
}

export function buildDestinationTouristJsonLd(destination: DestinationPage) {
  return buildTouristDestinationSchema({
    name: destination.name,
    description: destination.intro,
    path: destinationHref(destination.id),
    image: destination.image,
  });
}

export function buildBlogArticleJsonLd(post: BlogPost) {
  return buildArticleSchema({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    text: blogPostPlainText(post),
    schemaType: "BlogPosting",
    image: post.image,
    datePublished: post.date,
    dateModified: getBlogUpdatedDate(post),
    authorName: post.author,
    authorAvatar: post.authorAvatar ?? BLOG_EDITORIAL.avatar,
    about: [post.category, ...post.tags].filter(Boolean),
    speakable: true,
  });
}

export function buildContentPageArticleJsonLd(page: ContentPage) {
  return buildArticleSchema({
    title: page.title,
    description: page.description,
    path: contentPageHref(page),
    text: contentPagePlainText(page),
    datePublished: page.updatedAt,
    dateModified: page.updatedAt,
    authorName: BLOG_EDITORIAL.name,
    about: [page.category],
  });
}

export function buildGuideTopicArticleJsonLd(topic: GuideTopicPage) {
  return buildArticleSchema({
    title: topic.title,
    description: topic.shortDescription,
    path: guideTopicHref(topic.slug),
    text: guideTopicPlainText(topic),
    authorName: BLOG_EDITORIAL.name,
    about: [topic.title],
  });
}

export function buildGuidePillarArticleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  pillar: GuidePillarContent;
  intro?: string;
  about?: string[];
}) {
  return buildArticleSchema({
    title: input.title,
    description: input.description,
    path: input.path,
    text: guidePillarPlainText(input.pillar, {
      intro: input.intro,
      heroSubtitle: input.description,
    }),
    authorName: BLOG_EDITORIAL.name,
    about: input.about,
  });
}

export function buildKbEntryArticleJsonLd(entry: KbEntry) {
  const description = entry.summary?.trim() || entry.title;
  const verifiedAt = entry.last_verified?.trim();

  return buildArticleSchema({
    title: entry.title,
    description,
    path: entryHref(entry.id),
    text: kbEntryPlainText(entry),
    ...(verifiedAt ? { datePublished: verifiedAt, dateModified: verifiedAt } : {}),
    authorName: BLOG_EDITORIAL.name,
    about: entry.tags?.length ? entry.tags : undefined,
  });
}

export function buildEditorialArticleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  text: string;
  about?: string[];
}) {
  return buildArticleSchema({
    ...input,
    authorName: BLOG_EDITORIAL.name,
  });
}

export function buildBlogFaqJsonLd(
  items: Array<{ question: string; answer: string }>,
  pageUrl: string
) {
  return buildFaqPageSchema({ path: pageUrl, questions: items });
}
