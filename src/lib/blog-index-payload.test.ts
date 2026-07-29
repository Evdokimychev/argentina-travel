import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getBlogStartHerePostsFromCatalog,
  hydrateBlogIndexPosts,
  toBlogIndexPost,
} from "@/lib/blog-index-payload";
import { filterBlogPosts } from "@/lib/blog-utils";
import { BLOG_CATEGORY_META, BLOG_DEFAULT_CATEGORY_META } from "@/data/blog-category-meta";
import { getBlogHubImage } from "@/lib/media-resolver";
import type { BlogPost } from "@/types";

function post(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: "post-1",
    slug: "best-time-to-visit-argentina",
    title: "Когда ехать в Аргентину",
    excerpt: "Сезоны и регионы для первой поездки",
    content: `${"Патагония ".repeat(45)}секрет-за-пределом-поиска`,
    sections: [{ title: "Большой раздел", body: "Полный текст статьи".repeat(200) }],
    author: "Редакция",
    authorBio: "Авторы путеводителя",
    authorAvatar: "/media/avatar.webp",
    date: "2026-07-01",
    dateModified: "2026-07-02",
    image: "/media/blog/post.webp",
    category: "Путеводитель",
    readTime: "8 мин",
    readTimeMinutes: 8,
    tags: ["сезоны", "Патагония"],
    featured: true,
    editorialReviewed: true,
    relatedResources: [{ label: "Маршрут", href: "/guide", type: "guide" }],
    tourEmbeds: [
      {
        variant: "grid",
        title: "Туры",
        source: { kind: "preset", preset: "recommended" },
      },
    ],
    ...overrides,
  };
}

describe("blog index client payload", () => {
  it("keeps card and search fields while dropping full article-only data", () => {
    const source = post();
    const projected = toBlogIndexPost(source);

    expect(projected).toMatchObject({
      slug: source.slug,
      title: source.title,
      authorBio: source.authorBio,
      category: source.category,
      tags: source.tags,
    });
    expect(projected.content).toBe(source.content.slice(0, 400));
    expect(projected).not.toHaveProperty("sections");
    expect(projected).not.toHaveProperty("relatedResources");
    expect(projected).not.toHaveProperty("tourEmbeds");
    expect(JSON.stringify(projected).length).toBeLessThan(JSON.stringify(source).length / 2);
  });

  it("preserves the existing blog filter result for every searchable field", () => {
    const catalog = [
      post(),
      post({
        id: "post-2",
        slug: "mendoza-wine",
        title: "Винный маршрут Мендосы",
        excerpt: "Бодеги и дегустации",
        content: "Как составить маршрут по винодельням",
        category: "Винодельни",
        tags: ["Мендоса", "вино"],
      }),
    ];
    const projected = catalog.map(toBlogIndexPost);
    const cases = [
      { query: "Патагония" },
      { query: "Мендоса" },
      { query: "секрет-за-пределом-поиска" },
      { category: "Винодельни" },
      { tag: "сезоны" },
      { query: "редакция сезоны" },
    ];

    for (const options of cases) {
      expect(filterBlogPosts(projected, options).map((item) => item.slug)).toEqual(
        filterBlogPosts(catalog, options).map((item) => item.slug),
      );
    }
  });

  it("hydrates personalized and start-here selections from one compact catalog", () => {
    const catalog = [
      toBlogIndexPost(post()),
      toBlogIndexPost(post({ id: "post-2", slug: "mendoza-wine" })),
    ];

    expect(hydrateBlogIndexPosts(catalog, ["mendoza-wine", "missing"]).map((item) => item.slug)).toEqual([
      "mendoza-wine",
    ]);
    expect(getBlogStartHerePostsFromCatalog(catalog).map((item) => item.slug)).toContain(
      "best-time-to-visit-argentina",
    );
  });

  it("keeps full blog data and full tour selection outside the client boundary", () => {
    const root = join(process.cwd(), "src");
    const indexView = readFileSync(join(root, "components/blog/BlogIndexView.tsx"), "utf8");
    const page = readFileSync(join(root, "app/blog/page.tsx"), "utf8");
    const tours = readFileSync(join(root, "components/blog/BlogRecommendedTours.tsx"), "utf8");

    expect(indexView).not.toMatch(/from ["']@\/data\/blog["']/);
    expect(indexView).not.toContain("blogPosts");
    expect(indexView).toContain("initialPersonalizedSlugs");
    expect(page).toContain("toBlogIndexCatalog(indexable)");
    expect(page).toContain("pickBlogIndexFeaturedTours(marketplaceTours, 4)");
    expect(page).toContain("filterToursWithResolvedPublicDetail(featuredCandidates)");
    expect(page).toContain("resolveOptionalBlogTourCatalog(fetchMarketplaceTours())");
    expect(page).not.toContain("initialTours={");
    expect(tours).not.toContain("pickBlogIndexFeaturedTours");
    expect(tours).toContain("featuredTours.slice(0, 4)");
  });

  it("keeps blog client helpers independent from full editorial and media datasets", () => {
    const root = join(process.cwd(), "src");
    const categoryMeta = readFileSync(join(root, "data/blog-category-meta.ts"), "utf8");
    const internalLinks = readFileSync(join(root, "lib/blog-internal-links.ts"), "utf8");
    const slugResolver = readFileSync(join(root, "lib/blog-slug-resolve.ts"), "utf8");

    expect(categoryMeta).not.toContain("@/lib/media-resolver");
    expect(categoryMeta).not.toContain("manifest.json");
    expect(internalLinks).not.toContain('from "@/data/blog"');
    expect(slugResolver).not.toContain('from "@/data/blog"');
  });

  it("keeps the compact category media projection in sync with server bindings", () => {
    for (const [label, meta] of Object.entries(BLOG_CATEGORY_META)) {
      expect(meta.image, label).toBe(getBlogHubImage(label));
    }
    expect(BLOG_DEFAULT_CATEGORY_META.image).toBe(getBlogHubImage("Путешествия"));
  });
});
