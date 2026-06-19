import { blogPosts } from "@/data/blog";
import { BLOG_CONTENT_PLAN } from "@/data/blog-content-plan";
import { DESTINATION_PAGES } from "@/data/destination-pages";
import { GUIDE_TOPIC_LIST } from "@/data/guide-topics";
import { PLACES_SEED } from "@/data/places-seed";

export type ContentDocumentItem = {
  id: string;
  type: "blog" | "guide" | "destination" | "place" | "plan";
  title: string;
  href: string;
  status: "published" | "draft" | "planned";
  updatedAt: string | null;
  category?: string;
};

export type ContentInventorySummary = {
  counts: {
    blogPublished: number;
    blogPlanned: number;
    guideTopics: number;
    destinations: number;
    places: number;
  };
  documents: ContentDocumentItem[];
};

export function buildContentInventory(): ContentInventorySummary {
  const blogItems: ContentDocumentItem[] = blogPosts.map((post) => ({
    id: post.slug,
    type: "blog",
    title: post.title,
    href: `/blog/${post.slug}`,
    status: "published",
    updatedAt: post.date,
    category: post.category,
  }));

  const publishedSlugs = new Set(blogPosts.map((p) => p.slug));
  const planItems: ContentDocumentItem[] = BLOG_CONTENT_PLAN.filter(
    (item) => !publishedSlugs.has(item.slug)
  ).map((item) => ({
    id: item.slug,
    type: "plan",
    title: item.title,
    href: `/blog/${item.slug}`,
    status: "planned",
    updatedAt: null,
    category: item.category,
  }));

  const guideItems: ContentDocumentItem[] = GUIDE_TOPIC_LIST.map((topic) => ({
    id: topic.slug,
    type: "guide",
    title: topic.title,
    href: `/guide/${topic.slug}`,
    status: "published",
    updatedAt: null,
  }));

  const destinationItems: ContentDocumentItem[] = DESTINATION_PAGES.map((dest) => ({
    id: dest.id,
    type: "destination",
    title: dest.name,
    href: `/destinations/${dest.id}`,
    status: "published",
    updatedAt: null,
  }));

  const placeItems: ContentDocumentItem[] = PLACES_SEED.map((place) => ({
    id: place.slug,
    type: "place",
    title: place.name,
    href: `/places/${place.slug}`,
    status: "published",
    updatedAt: null,
  }));

  const documents = [...blogItems, ...planItems, ...guideItems, ...destinationItems, ...placeItems];

  return {
    counts: {
      blogPublished: blogItems.length,
      blogPlanned: planItems.length,
      guideTopics: guideItems.length,
      destinations: destinationItems.length,
      places: placeItems.length,
    },
    documents,
  };
}
