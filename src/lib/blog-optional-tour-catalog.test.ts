import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveOptionalBlogTourCatalog } from "@/lib/blog-optional-tour-catalog";
import type { TourListing } from "@/types";

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

  it("guards the promise inside the streamed tour embed boundary", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/blog/BlogPostView.tsx"),
      "utf8",
    );

    expect(source).toContain("resolveOptionalBlogTourCatalog(initialTours)");
    expect(source).toContain("<Suspense fallback={null}>");
  });
});
