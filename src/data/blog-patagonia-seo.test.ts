import { describe, expect, it } from "vitest";
import { getBlogPostBySlug } from "@/data/blog";
import { getTypedBlocksForSection } from "@/data/blog-typed-blocks";
import { getBlogEditorialIssues } from "@/lib/blog-editorial-readiness";

const SLUG = "el-chalten-i-fitts-roy";

describe("El Chaltén Patagonia search-intent pillar", () => {
  it("stays public and covers the core trekking intents with official provenance", () => {
    const post = getBlogPostBySlug(SLUG);

    expect(post).toBeDefined();
    expect(post?.noIndex).not.toBe(true);
    expect(post?.editorialReviewed).toBe(true);
    expect(post?.seoTitle).toContain("Треккинг в Эль-Чальтене");
    expect(post?.excerpt).toContain("Лагуна-де-лос-Трес");
    expect(post?.dateModified).toBe("2026-07-17");
    expect(post?.sections?.length).toBeGreaterThanOrEqual(10);
    expect(post?.content).toContain("25 км");
    expect(post?.content).toContain("8–9 часов");
    expect(post?.content).toContain("18 км");
    expect(post?.content).toContain("с мая по сентябрь");
    expect(post?.content).toContain("северная зона входит в действующую систему платного доступа");
    expect(post?.content).not.toMatch(/тропы\s+бесплат/iu);
    expect(post?.content).toContain("https://www.argentina.gob.ar/node/131189");
    expect(getBlogEditorialIssues(post!)).toEqual([]);
  });

  it("links the cluster to place, park, packing guide and interactive map", () => {
    const post = getBlogPostBySlug(SLUG);
    const hrefs = new Set(post?.relatedResources?.map((resource) => resource.href));

    expect(hrefs).toContain("/places/el-chalten");
    expect(hrefs).toContain("/places/fitz-roy");
    expect(hrefs).toContain("/blog/natsionalnyy-park-los-glasiares");
    expect(hrefs).toContain("/blog/patagonia-packing-list");
    expect([...hrefs].some((href) => href?.startsWith("/mapa-argentina?q="))).toBe(true);
  });

  it("renders reviewed local photos and a focused map CTA", () => {
    const routeBlocks = getTypedBlocksForSection(SLUG, "Как выбрать маршрут") ?? [];
    const lagunaBlocks =
      getTypedBlocksForSection(SLUG, "Лагуна-де-лос-Трес: главный маршрут к Фицрою") ?? [];
    const mapBlocks =
      getTypedBlocksForSection(SLUG, "Карта троп и мест вокруг Эль-Чальтена") ?? [];

    expect(routeBlocks).toContainEqual(
      expect.objectContaining({
        type: "media",
        src: "/media/blog/el-chalten-i-fitts-roy/section-1.jpg",
      }),
    );
    expect(lagunaBlocks).toContainEqual(
      expect.objectContaining({
        type: "media",
        src: "/media/blog/el-chalten-i-fitts-roy/section-2.jpg",
      }),
    );
    expect(mapBlocks).toContainEqual(
      expect.objectContaining({ type: "map", lat: -49.3325, lng: -72.8865 }),
    );
    expect(mapBlocks).toContainEqual(
      expect.objectContaining({
        type: "cta",
        href: expect.stringContaining("/mapa-argentina?q="),
      }),
    );
  });
});
