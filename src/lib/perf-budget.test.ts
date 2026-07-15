import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "src");

describe("Phase 6 — perf budget guards", () => {
  it("ToursCatalog lazy-loads heavy filter/search shells", () => {
    const source = readFileSync(join(root, "components/marketplace/ToursCatalog.tsx"), "utf8");
    expect(source).toMatch(/dynamic\(\(\) => import\("@\/components\/marketplace\/SearchBlock"\)/);
    expect(source).toMatch(/dynamic\(\(\) => import\("@\/components\/marketplace\/FilterBar"\)/);
    expect(source).toMatch(
      /dynamic\(\(\) => import\("@\/components\/marketplace\/CatalogFiltersSheet"\)/,
    );
    expect(source).toContain("catalog-listing-page-results-grid");
  });

  it("BlogIndexView keeps catalog mounted while URL params sync", () => {
    const indexView = readFileSync(join(root, "components/blog/BlogIndexView.tsx"), "utf8");
    const urlSync = readFileSync(join(root, "components/blog/BlogIndexUrlSync.tsx"), "utf8");
    expect(indexView).toContain("BlogIndexUrlSync");
    expect(indexView).not.toMatch(/Suspense fallback=\{null\}[\s\S]*BlogSearchFilters/);
    expect(urlSync).toContain("useSearchParams");
  });

  it("Podbor route lazy-loads framer-motion shell", () => {
    const page = readFileSync(join(root, "app/podbor/page.tsx"), "utf8");
    expect(page).toMatch(/dynamic\(\(\) => import\("@\/components\/podbor\/PodborView"\)/);
  });

  it("blog index reserves catalog layout space", () => {
    const css = readFileSync(join(root, "components/blog/blog-index.css"), "utf8");
    expect(css).toContain("#blog-catalog");
    expect(css).toMatch(/min-height:\s*28rem/);
    expect(css).toContain(".blog-index-toolbar");
  });

  it("critical heroes rely on next/image responsive preload", () => {
    const home = readFileSync(join(root, "app/page.tsx"), "utf8");
    const blogIndex = readFileSync(join(root, "app/blog/page.tsx"), "utf8");
    const blogPost = readFileSync(join(root, "app/blog/[slug]/page.tsx"), "utf8");
    expect(home).not.toContain('rel="preload" as="image"');
    expect(blogIndex).not.toContain('rel="preload"');
    expect(blogPost).not.toContain('rel="preload" as="image"');
  });

  it("tour loading state keeps the footer below the initial viewport", () => {
    const loading = readFileSync(join(root, "app/tours/[slug]/loading.tsx"), "utf8");
    expect(loading).toContain("min-h-[1800px]");
  });
});
