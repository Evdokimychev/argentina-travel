import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SITE_NAV_COMPACT_PRIMARY_IDS,
  SITE_NAV_SECTIONS,
} from "@/data/site-nav";
import { buildBlogPostUiBreadcrumbs } from "@/lib/blog-breadcrumbs";
import type { BlogPost } from "@/types";

const samplePost = {
  slug: "patagonia-guide",
  title: "Путеводитель по Патагонии",
  category: "Патагония",
} as BlogPost;

describe("Sprint 3 UX stabilization", () => {
  it("compact nav includes excursions in primary bar", () => {
    expect(SITE_NAV_COMPACT_PRIMARY_IDS).toContain("excursions");
  });

  it("tours nav section has direct hub href", () => {
    const tours = SITE_NAV_SECTIONS.find((section) => section.id === "tours");
    expect(tours?.href).toBe("/tours");
  });

  it("blog post breadcrumb ends with article title", () => {
    const crumbs = buildBlogPostUiBreadcrumbs(samplePost);
    expect(crumbs.at(-1)?.label).toBe(samplePost.title);
    expect(crumbs.at(-1)?.href).toBeUndefined();
  });

  it("blog card tags link to blog tag filter", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/blog/BlogCard.tsx"),
      "utf8",
    );
    expect(source).toMatch(/\/blog\?tag=/);
  });

  it("excursion catalog hides map mode until interactive map ships", () => {
    const catalog = readFileSync(
      resolve(process.cwd(), "src/components/excursions/ExcursionsCatalog.tsx"),
      "utf8",
    );
    expect(catalog).toContain("enableMapView={false}");
    expect(catalog).not.toMatch(/viewMode === "map"/);
    expect(catalog).not.toMatch(/ExcursionCatalogMapStub/);
  });

  it("experts page is linked from site navigation", () => {
    const navSource = readFileSync(resolve(process.cwd(), "src/data/site-nav.ts"), "utf8");
    expect(navSource).toMatch(/\/experts/);
  });
});
