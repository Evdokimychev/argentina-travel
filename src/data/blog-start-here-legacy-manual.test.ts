import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { blogPosts, getBlogStartHerePosts } from "@/data/blog";
import { BLOG_START_HERE_SLUGS } from "@/data/blog-canonical-map";

/** Sprint 3 priority pillars: must not remain editable SSOT in legacyManual* maps. */
const PILLAR_SLUGS_FREE_OF_LEGACY_MAPS = [
  "el-chalten-i-fitts-roy",
  "salta-i-severo-zapad-marshrut",
  "best-time-to-visit-argentina",
  "buenos-aires-rajony",
  "argentinian-steak-guide",
  "mendoza-vinnyj-gid",
  "tango-beginners-guide",
  "patagonia-packing-list",
] as const;

function extractConstBlock(raw: string, constName: string): string {
  const start = raw.indexOf(`const ${constName}`);
  expect(start).toBeGreaterThanOrEqual(0);
  const after = raw.slice(start);
  const end = after.indexOf("\n};");
  expect(end).toBeGreaterThan(0);
  return after.slice(0, end + 3);
}

describe("start-here / REWRITE_QUEUE pillars vs legacyManual* maps", () => {
  const blogTs = readFileSync(join(process.cwd(), "src/data/blog.ts"), "utf8");

  const mapBlocks = [
    extractConstBlock(blogTs, "legacyManualOfficialSources"),
    extractConstBlock(blogTs, "legacyManualExcerptOverrides"),
    extractConstBlock(blogTs, "legacyManualReplacementSections"),
    extractConstBlock(blogTs, "legacyManualSectionOverrides"),
    extractConstBlock(blogTs, "legacyManualRemovedSections"),
  ];

  it("covers the fixed start-here collection", () => {
    expect([...BLOG_START_HERE_SLUGS].sort()).toEqual([...PILLAR_SLUGS_FREE_OF_LEGACY_MAPS].sort());
    expect(getBlogStartHerePosts()).toHaveLength(BLOG_START_HERE_SLUGS.length);
  });

  it.each(PILLAR_SLUGS_FREE_OF_LEGACY_MAPS)(
    "%s is published without legacyManual override map keys",
    (slug) => {
      const post = blogPosts.find((item) => item.slug === slug);
      expect(post).toBeTruthy();
      expect(post!.noIndex).not.toBe(true);
      expect(post!.sections?.length).toBeGreaterThan(0);

      for (const block of mapBlocks) {
        expect(block).not.toContain(`"${slug}"`);
      }
    },
  );

  it("migrated typed pillars keep official sources inside the module body", () => {
    for (const slug of ["el-chalten-i-fitts-roy", "salta-i-severo-zapad-marshrut"] as const) {
      const post = blogPosts.find((item) => item.slug === slug);
      expect(post!.sections?.some((section) => section.title.includes("Источники"))).toBe(true);
      expect(post!.content).toMatch(/argentina\.gob\.ar/i);
      expect(post!.dateModified).toBe("2026-07-17");
    }
  });

  it("el-chalten and salta wire through typed modules, not inline legacy corpus bodies", () => {
    expect(blogTs).toContain("EL_CHALTEN_I_FITTS_ROY_POST");
    expect(blogTs).toContain("SALTA_I_SEVERO_ZAPAD_MARSHRUT_POST");
    expect(blogTs).not.toContain('id: "blog-el-chalten"');
    expect(blogTs).not.toContain('id: "blog-salta-nw-route"');
  });
});
