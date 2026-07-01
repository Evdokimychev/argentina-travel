import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { blogPosts } from "@/data/blog";
import { galleryItems } from "@/data/gallery-items";
import { computeBlogStats, filterIndexableBlogPosts } from "@/lib/blog-utils";
import { getTourDetailBySlug as getPatagoniaTourDetail } from "@/data/tour-details/patagonia";
import { marketplaceTours } from "@/data/marketplace-tours";
import {
  formatTourPriceForPdf,
  tourPriceSourcesMatch,
} from "@/lib/tour-pricing";
import { MAP_KIND_COLORS } from "@/lib/map-kind-colors";
import { blogMediaFolder } from "@/lib/blog-media-path";

const root = join(process.cwd(), "src");
const scriptsRoot = join(process.cwd(), "scripts");
const testsRoot = join(process.cwd(), "tests");

const LIGHTHOUSE_PHASE2_PATHS = [
  "/",
  "/tours",
  "/tours/patagonia-glaciers",
  "/blog",
  "/blog/natsionalnyy-park-iguasu",
  "/mapa-argentina",
  "/immigration",
  "/destinations/patagonia",
  "/places",
  "/destinations",
  "/about",
  "/contacts",
  "/en/places",
];

const VISUAL_SMOKE_PATHS = [
  "/",
  "/tours",
  "/tours/patagonia-glaciers",
  "/blog",
  "/blog/buenos-aires-rajony",
  "/blog/natsionalnyy-park-iguasu",
  "/destinations/patagonia",
  "/mapa-argentina",
  "/immigration",
  "/gallery",
];

function loadIndexableSlugsWithoutHero(): string[] {
  const indexable = filterIndexableBlogPosts(blogPosts).map((p) => p.slug);
  return indexable.filter((slug) => {
    const heroPath = join(process.cwd(), "public/media/blog", blogMediaFolder(slug), "hero.jpg");
    return !existsSync(heroPath);
  });
}

describe("Sprint 11 — final QA gate (S5–S10 regression)", () => {
  it("indexable blog hero local coverage is at least 95%", () => {
    const indexable = filterIndexableBlogPosts(blogPosts);
    const missing = loadIndexableSlugsWithoutHero();
    const covered = indexable.length - missing.length;
    const pct = indexable.length ? (covered / indexable.length) * 100 : 100;
    expect(pct).toBeGreaterThanOrEqual(95);
    expect(missing.length).toBeLessThanOrEqual(Math.ceil(indexable.length * 0.05));
  });

  it("blog stats use single source of truth (N-03)", () => {
    const stats = computeBlogStats(blogPosts);
    expect(stats.indexablePosts).toBe(filterIndexableBlogPosts(blogPosts).length);
    expect(stats.totalPosts).toBe(blogPosts.length);
  });

  it("gallery page uses masonry grid, lightbox and manifest-only images", () => {
    const view = readFileSync(join(root, "components/gallery/GalleryPageView.tsx"), "utf8");
    expect(view).toContain("columns-2");
    expect(view).toContain("setLightboxItem");
    expect(view).toContain("role=\"dialog\"");
    expect(galleryItems.length).toBeGreaterThanOrEqual(12);
    for (const item of galleryItems) {
      expect(item.imageUrl.startsWith("/media/")).toBe(true);
      expect(item.imageUrl).not.toContain("logo");
    }
  });

  it("collections index has hero band and destination-style card grid", () => {
    const view = readFileSync(join(root, "components/collections/CollectionsIndexView.tsx"), "utf8");
    expect(view).toContain("Hero");
    expect(view).toContain("SectionShell");
    expect(view).toContain("aspect-[4/3]");
    expect(view).toContain("CollectionCard");
  });

  it("patagonia tour clarifies Chile border and visa facts (T-01, T-02, N-04)", () => {
    const detail = getPatagoniaTourDetail("patagonia-glaciers");
    const listing = marketplaceTours.find((t) => t.slug === "patagonia-glaciers");
    expect(detail).toBeDefined();
    expect(listing).toBeDefined();
    expect(detail!.shortDescription).toMatch(/Чили/);
    expect(detail!.shortDescription).toMatch(/границ/);
    expect(tourPriceSourcesMatch(listing!.priceUsd, detail!.priceUsd, detail!.dates)).toBe(true);
    expect(formatTourPriceForPdf({ priceUsd: detail!.priceUsd })).toMatch(/\$2/);

    const faq = detail!.faq?.find((f) => f.question.includes("виза"));
    expect(faq?.answer).toMatch(/обычно не требуется/);
    expect(faq?.answer).not.toMatch(/нужна виза РФ/i);
  });

  it("immigration uses consistent 15 grounds count (N-02)", () => {
    const hub = readFileSync(join(root, "data/immigration-hub-content.ts"), "utf8");
    const immigrationPage = readFileSync(join(root, "app/immigration/page.tsx"), "utf8");
    expect(hub).toMatch(/15 оснований/);
    expect(immigrationPage).toMatch(/15 оснований/);
    expect(hub).not.toMatch(/14 оснований/);
    expect(immigrationPage).not.toMatch(/14 оснований/);
  });

  it("iguazu copy uses ~275 waterfalls, not 280 (N-01)", () => {
    const podbor = readFileSync(join(root, "data/podbor/regions.ts"), "utf8");
    expect(podbor).toMatch(/275 водопад/);
    expect(podbor).not.toMatch(/280 водопад/);
  });

  it("S5–S10 sprint regression files remain wired", () => {
    const sprintTests = [
      "sprint5-trust.test.ts",
      "sprint6-home.test.ts",
      "sprint7-tours.test.ts",
      "sprint8-geography.test.ts",
      "sprint9-editorial.test.ts",
      "sprint10-design.test.ts",
    ];
    for (const file of sprintTests) {
      expect(existsSync(join(root, "lib", file)), file).toBe(true);
    }
    expect(Object.keys(MAP_KIND_COLORS).length).toBeGreaterThanOrEqual(7);
  });

  it("phase-2 Lighthouse automation covers 13 public URLs with perf + a11y", () => {
    const script = readFileSync(join(scriptsRoot, "lighthouse-phase2-ci.mjs"), "utf8");
    expect(script).toContain("LIGHTHOUSE_PHASE2_PATHS");
    expect(script).toContain("performance,accessibility");
    expect(LIGHTHOUSE_PHASE2_PATHS.length).toBe(13);
    for (const path of LIGHTHOUSE_PHASE2_PATHS) {
      expect(script).toContain(path);
    }
  });

  it("visual smoke e2e defines 10 URL screenshot baselines", () => {
    const spec = readFileSync(join(testsRoot, "e2e/visual-smoke.spec.ts"), "utf8");
    expect(VISUAL_SMOKE_PATHS.length).toBe(10);
    for (const path of VISUAL_SMOKE_PATHS) {
      expect(spec).toContain(path);
    }
    expect(spec).toContain("toHaveScreenshot");
  });

  it("production smoke includes gallery, collections, immigration and map hub", () => {
    const smoke = readFileSync(join(scriptsRoot, "production-smoke.mjs"), "utf8");
    expect(smoke).toContain("/gallery");
    expect(smoke).toContain("/collections");
    expect(smoke).toContain("/immigration");
    expect(smoke).toContain("/mapa-argentina");
  });
});
