import { GUIDE_ABOUT_ARGENTINA, GUIDE_ABOUT_ARGENTINA_PATH } from "@/data/guide-about-argentina";
import { blogPosts } from "@/data/blog";
import { PLACE_ENRICHMENTS } from "@/data/places-enrichment";
import {
  DESTINATION_TO_PLACE,
  PLACE_TO_DESTINATION,
  type KnowledgeEntityRef,
  type KnowledgeEntityType,
} from "@/data/knowledge-graph/entities";
import { KNOWLEDGE_RELATIONS } from "@/data/knowledge-graph/relations";
import { COLLECTIONS_SEED, ITINERARIES_SEED, PLACES_SEED } from "@/data/places-seed";
import { getAllGuideTopics, guideTopicHref } from "@/lib/guide-topics";
import { collectionHref, itineraryHref, placeHref } from "@/lib/places-repository";
import { destinationHref } from "@/lib/destinations";

export type KnowledgeLinksBundle = {
  places: KnowledgeEntityRef[];
  destinations: KnowledgeEntityRef[];
  collections: KnowledgeEntityRef[];
  itineraries: KnowledgeEntityRef[];
  guides: KnowledgeEntityRef[];
  blog: KnowledgeEntityRef[];
};

const GUIDE_TOPIC_BY_TAG: Record<string, string> = {
  столица: "kultura",
  танго: "kultura",
  гастрономия: "kukhnya",
  ледник: "pogoda-i-sezonnost",
  патагония: "patagoniya-s-chego-nachat",
  треккинг: "patagoniya-s-chego-nachat",
  unesco: "ob-argentine",
  вино: "kukhnya",
};

const GUIDE_ARTICLE_REFS: Record<string, { title: string; href: string }> = {
  "patagoniya-s-chego-nachat": {
    title: "Патагония: с чего начать",
    href: "/guide/patagoniya-s-chego-nachat",
  },
  "ob-argentine": {
    title: "Об Аргентине",
    href: GUIDE_ABOUT_ARGENTINA_PATH,
  },
};

function ref(
  type: KnowledgeEntityType,
  slug: string,
  title: string,
  href: string,
): KnowledgeEntityRef {
  return { type, slug, title, href };
}

function uniqueRefs(refs: KnowledgeEntityRef[]): KnowledgeEntityRef[] {
  const seen = new Set<string>();
  return refs.filter((item) => {
    const key = `${item.type}:${item.slug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function resolveKnowledgeLinksForPlace(placeSlug: string): KnowledgeLinksBundle {
  const place = PLACES_SEED.find((p) => p.slug === placeSlug);
  if (!place) {
    return { places: [], destinations: [], collections: [], itineraries: [], guides: [], blog: [] };
  }

  const graphPlaces = KNOWLEDGE_RELATIONS.filter(
    (r) =>
      (r.from.type === "place" && r.from.slug === placeSlug && r.to.type === "place") ||
      (r.to.type === "place" && r.to.slug === placeSlug && r.from.type === "place"),
  )
    .map((r) => (r.from.slug === placeSlug ? r.to.slug : r.from.slug))
    .map((slug) => {
      const p = PLACES_SEED.find((x) => x.slug === slug);
      return p ? ref("place", p.slug, p.name, placeHref(p.slug)) : null;
    })
    .filter((x): x is KnowledgeEntityRef => x != null);

  const tagPlaces = PLACES_SEED.filter(
    (p) =>
      p.slug !== placeSlug &&
      p.tags.some((tag) => place.tags.includes(tag)),
  )
    .slice(0, 5)
    .map((p) => ref("place", p.slug, p.name, placeHref(p.slug)));

  const collections = COLLECTIONS_SEED.filter((c) => c.placeSlugs.includes(placeSlug)).map((c) =>
    ref("collection", c.slug, c.title, collectionHref(c.slug)),
  );

  const extraCollections = COLLECTIONS_SEED.filter(
    (c) =>
      !c.placeSlugs.includes(placeSlug) &&
      c.placeSlugs.some((s) => {
        const other = PLACES_SEED.find((p) => p.slug === s);
        return other && other.region === place.region;
      }),
  )
    .slice(0, 2)
    .map((c) => ref("collection", c.slug, c.title, collectionHref(c.slug)));

  const itineraries = ITINERARIES_SEED.filter((it) =>
    it.stops.some((s) => s.placeSlug === placeSlug),
  ).map((it) => ref("itinerary", it.slug, it.title, itineraryHref(it.slug)));

  const destSlug = PLACE_TO_DESTINATION[placeSlug];
  const destinations = destSlug
    ? [
        ref(
          "destination",
          destSlug,
          PLACES_SEED.find((p) => p.slug === placeSlug)?.name ?? destSlug,
          destinationHref(destSlug),
        ),
      ]
    : [];

  const guideSlugs = new Set<string>();
  for (const tag of place.tags) {
    const topic = GUIDE_TOPIC_BY_TAG[tag];
    if (topic) guideSlugs.add(topic);
  }
  guideSlugs.add("kak-dobratsya");
  if (place.region.includes("Патагония")) guideSlugs.add("patagoniya-s-chego-nachat");

  const guidesFromTopics = getAllGuideTopics()
    .filter((t) => guideSlugs.has(t.slug))
    .map((t) => ref("guide_topic", t.slug, t.title, guideTopicHref(t.slug)));

  const guidesFromArticles = [...guideSlugs]
    .filter((slug) => GUIDE_ARTICLE_REFS[slug] && !getAllGuideTopics().some((t) => t.slug === slug))
    .map((slug) => {
      const article = GUIDE_ARTICLE_REFS[slug];
      return ref("guide_article", slug, article.title, article.href);
    });

  const guides = [...guidesFromTopics, ...guidesFromArticles].slice(0, 5);

  const blog = blogPosts
    .filter((post) => {
      const haystack = `${post.title} ${post.excerpt} ${post.tags?.join(" ") ?? ""}`.toLowerCase();
      return place.tags.some((tag) => haystack.includes(tag)) || haystack.includes(place.name.toLowerCase());
    })
    .slice(0, 3)
    .map((post) => ref("blog_article", post.slug, post.title, `/blog/${post.slug}`));

  return {
    places: uniqueRefs([...graphPlaces, ...tagPlaces]).slice(0, 5),
    destinations: uniqueRefs(destinations),
    collections: uniqueRefs([...collections, ...extraCollections]).slice(0, 3),
    itineraries: uniqueRefs(itineraries).slice(0, 3),
    guides: uniqueRefs(guides).slice(0, 3),
    blog: uniqueRefs(blog),
  };
}

export function resolveKnowledgeLinksForDestination(destSlug: string): KnowledgeLinksBundle {
  const placeSlug = DESTINATION_TO_PLACE[destSlug];
  if (!placeSlug) {
    return { places: [], destinations: [], collections: [], itineraries: [], guides: [], blog: [] };
  }
  const bundle = resolveKnowledgeLinksForPlace(placeSlug);
  return {
    ...bundle,
    destinations: [],
  };
}

export function resolveKnowledgeLinksForAboutArgentina(): KnowledgeLinksBundle {
  const destinations = GUIDE_ABOUT_ARGENTINA.regions
    .filter((region) => region.href.startsWith("/destinations/"))
    .slice(0, 6)
    .map((region) => {
      const slug = region.href.replace("/destinations/", "");
      return ref("destination", slug, region.title, region.href);
    });

  const featuredPlaceSlugs = [
    "buenos-aires",
    "perito-moreno-glacier",
    "iguazu-falls",
    "bariloche",
    "el-calafate",
    "salta",
  ];
  const places = featuredPlaceSlugs
    .map((slug) => {
      const place = PLACES_SEED.find((p) => p.slug === slug);
      return place ? ref("place", place.slug, place.name, placeHref(place.slug)) : null;
    })
    .filter((x): x is KnowledgeEntityRef => x != null);

  const collections = COLLECTIONS_SEED.slice(0, 4).map((c) =>
    ref("collection", c.slug, c.title, collectionHref(c.slug)),
  );

  const itineraries = ITINERARIES_SEED.slice(0, 3).map((it) =>
    ref("itinerary", it.slug, it.title, itineraryHref(it.slug)),
  );

  const guideSlugs = new Set(GUIDE_ABOUT_ARGENTINA.practicalCards.map((card) => {
    const match = card.href.match(/^\/guide\/([^/]+)/);
    return match?.[1] ?? null;
  }).filter((slug): slug is string => slug != null));
  guideSlugs.add("ob-argentine");

  const guides = getAllGuideTopics()
    .filter((topic) => guideSlugs.has(topic.slug))
    .map((topic) => ref("guide_topic", topic.slug, topic.title, guideTopicHref(topic.slug)));

  const guidesFromArticles = [...guideSlugs]
    .filter((slug) => GUIDE_ARTICLE_REFS[slug] && !getAllGuideTopics().some((t) => t.slug === slug))
    .map((slug) => {
      const article = GUIDE_ARTICLE_REFS[slug];
      return ref("guide_article", slug, article.title, article.href);
    });

  const blog = blogPosts
    .slice(0, 3)
    .map((post) => ref("blog_article", post.slug, post.title, `/blog/${post.slug}`));

  return {
    places: uniqueRefs(places),
    destinations: uniqueRefs(destinations),
    collections: uniqueRefs(collections),
    itineraries: uniqueRefs(itineraries),
    guides: uniqueRefs([...guides, ...guidesFromArticles]).slice(0, 5),
    blog: uniqueRefs(blog),
  };
}

export function countKnowledgeLinks(bundle: KnowledgeLinksBundle): number {
  return (
    bundle.places.length +
    bundle.destinations.length +
    bundle.collections.length +
    bundle.itineraries.length +
    bundle.guides.length +
    bundle.blog.length
  );
}

/** Place slugs with editorial enrichment available */
export function getEnrichedPlaceSlugs(): string[] {
  return Object.keys(PLACE_ENRICHMENTS);
}
