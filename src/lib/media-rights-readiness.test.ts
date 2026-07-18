import { describe, expect, it } from "vitest";

import {
  auditReferencedMedia,
  normalizeMediaPath,
  requiresDesktopHeroResolution,
} from "../../scripts/media-rights-readiness";
import type { MediaAsset } from "@/types/media-asset";

function asset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: "asset-1",
    title: "Патагония",
    alt: "Горы Патагонии",
    caption: "Фото Патагонии",
    source: "pexels",
    sourceUrl: "https://www.pexels.com/photo/1/",
    license: "Pexels License",
    author: "Photographer",
    category: "destination",
    tags: ["patagonia"],
    localPath: "media/test/missing.jpg",
    role: "hero",
    ...overrides,
  };
}

describe("media rights readiness", () => {
  it("normalizes only local media paths", () => {
    expect(normalizeMediaPath("/media/places/a.jpg?v=1")).toBe("media/places/a.jpg");
    expect(normalizeMediaPath("https://cdn.example/media/places/a.jpg")).toBe("media/places/a.jpg");
    expect(normalizeMediaPath("/logo-light.svg")).toBeNull();
  });

  it("flags missing files and incomplete rights metadata", async () => {
    const current = asset({ author: undefined, sourceUrl: "", license: "" });
    const references = new Map([[current.localPath, new Set(["test:hero"])]]);
    const result = await auditReferencedMedia({
      assets: [current],
      references,
      publicRoot: process.cwd(),
    });
    expect(result.countsByCode).toMatchObject({
      missing_file: 1,
      missing_author: 1,
      missing_source_url: 1,
      missing_license: 1,
    });
    expect(result.countsBySeverity.high).toBe(4);
  });

  it("flags a referenced local file without a manifest record", async () => {
    const references = new Map([["media/not-in-manifest.jpg", new Set(["test:literal"])]]);
    const result = await auditReferencedMedia({
      assets: [],
      references,
      publicRoot: process.cwd(),
    });
    expect(result.countsByCode.unmanaged_missing_file).toBe(1);
  });

  it("does not apply desktop hero width to mobile or category-card assets", () => {
    expect(
      requiresDesktopHeroResolution(
        asset({ localPath: "media/home/hero-mobile.webp" }),
        ["literal:src/lib/organizer-waitlist-server.ts"],
      ),
    ).toBe(false);
    expect(
      requiresDesktopHeroResolution(asset({ localPath: "media/blog/relocation.jpg" }), [
        "literal:src/data/blog-category-meta.ts",
      ]),
    ).toBe(false);
    expect(
      requiresDesktopHeroResolution(asset({ localPath: "media/places/bariloche/hero.jpg" }), [
        "place:bariloche:cover",
      ]),
    ).toBe(true);
  });
});
