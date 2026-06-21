import type { DestinationPage } from "@/data/destination-pages";
import type { BlogPost } from "@/types";
import type { PlaceCollection, PlaceItinerary } from "@/types/place";
import { destinationHref } from "@/lib/destinations";
import { collectionHref, itineraryHref, placeHref } from "@/lib/places-repository";
import {
  buildArticleSchema,
  buildFaqPageSchema,
  buildTouristDestinationSchema,
} from "@/lib/schema-json-ld";
import { getBlogUpdatedDate } from "@/lib/blog-utils";
import { absoluteUrl } from "@/lib/site-url";

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
  return {
    "@context": "https://schema.org",
    "@type": "Trip",
    name: itinerary.title,
    description: itinerary.description,
    url: absoluteUrl(itineraryHref(itinerary.slug)),
    image: itinerary.coverImage,
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
    excerpt: post.excerpt,
    slug: post.slug,
    image: post.image,
    datePublished: post.date,
    dateModified: getBlogUpdatedDate(post),
    authorName: post.author,
  });
}

export function buildBlogFaqJsonLd(
  items: Array<{ question: string; answer: string }>,
  pageUrl: string
) {
  return buildFaqPageSchema({ path: pageUrl, questions: items });
}
