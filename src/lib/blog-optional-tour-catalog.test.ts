import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  pickBlogPostTourCandidates,
  resolveOptionalBlogTourCatalog,
} from "@/lib/blog-optional-tour-catalog";
import type { TourListing } from "@/types";
import type { TourEmbedConfig } from "@/types/tour-embed";

function tour(slug: string): TourListing {
  return {
    id: slug,
    slug,
    title: slug,
    destination: "Argentina",
    region: "Argentina",
    country: "Argentina",
    shortDescription: "Argentina",
  } as TourListing;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("optional blog tour catalog", () => {
  it("preserves a successful catalog", async () => {
    const tours: TourListing[] = [];
    await expect(resolveOptionalBlogTourCatalog(tours)).resolves.toBe(tours);
  });

  it("omits the embed without leaking or rejecting when its catalog is unavailable", async () => {
    const report = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      resolveOptionalBlogTourCatalog(Promise.reject(new Error("provider secret must stay private"))),
    ).resolves.toEqual([]);

    expect(report).toHaveBeenCalledWith("[blog_optional_tour_catalog_unavailable]", {
      fallback: "embed_omitted",
    });
    expect(JSON.stringify(report.mock.calls)).not.toContain("provider secret");
  });

  it("selects and deduplicates only listings that configured embeds can render", () => {
    const tours = [tour("a"), tour("b"), tour("c"), tour("unused")];
    const embeds: TourEmbedConfig[] = [
      {
        variant: "grid",
        title: "First",
        limit: 2,
        source: { kind: "slugs", slugs: ["a", "b", "unused"] },
      },
      {
        variant: "spotlight",
        title: "Second",
        source: { kind: "slugs", slugs: ["b", "c"] },
      },
    ];

    expect(pickBlogPostTourCandidates(tours, embeds).map((item) => item.slug)).toEqual([
      "a",
      "b",
    ]);
  });

  it("does not schedule optional detail work when the article has no tour embeds", () => {
    expect(pickBlogPostTourCandidates([tour("unused")], [])).toEqual([]);
  });

  it("guards the promise inside the streamed tour embed boundary", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/blog/BlogPostView.tsx"),
      "utf8",
    );

    expect(source).toContain("resolveOptionalBlogTourCatalog(initialTours)");
    expect(source).toContain("<Suspense fallback={null}>");
  });

  it("keeps optional marketplace failures outside every public blog critical path", () => {
    const root = path.join(process.cwd(), "src/app/blog");
    const index = fs.readFileSync(path.join(root, "page.tsx"), "utf8");
    const hub = fs.readFileSync(path.join(root, "hub/[hubId]/page.tsx"), "utf8");
    const article = fs.readFileSync(path.join(root, "[slug]/page.tsx"), "utf8");
    const author = fs.readFileSync(path.join(root, "author/[slug]/page.tsx"), "utf8");

    expect(index).toContain("resolveOptionalBlogTourCatalog(fetchMarketplaceTours())");
    expect(hub).toContain("resolveOptionalBlogTourCatalog(fetchMarketplaceTours())");
    expect(article).toContain("pickBlogPostTourCandidates(tours, tourEmbeds)");
    expect(article).toContain("resolveOptionalBlogTourCatalog(fetchMarketplaceTours())");
    expect(article).toContain("tourEmbeds.length === 0");
    expect(author).toContain("pickBlogPostTourCandidates(tours, tourEmbeds)");
    expect(author).toContain("resolveOptionalBlogTourCatalog(fetchMarketplaceTours())");
    expect(author).toContain("tourEmbeds.length === 0");
    expect(article).not.toContain("await fetchMarketplaceTours()");
    expect(author).not.toContain("await fetchMarketplaceTours()");
  });
});
