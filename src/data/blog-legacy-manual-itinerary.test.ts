import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { blogPosts } from "@/data/blog";

const MIGRATED_SLUGS = [
  "itinerary-за-14-дней",
  "itinerary-за-10-дней",
  "itinerary-чек-лист",
  "itinerary-ошибки",
  "iguazu-за-3-дня",
  "patagonia-авиабилеты",
  "wildlife-с-гидом",
  "patagonia-penguins",
  "patagonia-whale-watching",
  "iguazu-garganta-del-diablo",
  "uco-valley-vino-i-gory",
] as const;

function extractConstBlock(raw: string, constName: string): string {
  const start = raw.indexOf(`const ${constName}`);
  expect(start).toBeGreaterThanOrEqual(0);
  const after = raw.slice(start);
  const end = after.indexOf("\n};");
  expect(end).toBeGreaterThan(0);
  return after.slice(0, end + 3);
}

describe("itinerary / logistics pillars vs legacyManual* maps", () => {
  const blogTs = readFileSync(join(process.cwd(), "src/data/blog.ts"), "utf8");
  const mapBlocks = [
    extractConstBlock(blogTs, "legacyManualOfficialSources"),
    extractConstBlock(blogTs, "legacyManualExcerptOverrides"),
    extractConstBlock(blogTs, "legacyManualReplacementSections"),
    extractConstBlock(blogTs, "legacyManualSectionOverrides"),
    extractConstBlock(blogTs, "legacyManualRemovedSections"),
  ];

  it.each(MIGRATED_SLUGS)("%s is published without legacyManual override map keys", (slug) => {
    const post = blogPosts.find((item) => item.slug === slug);
    expect(post, slug).toBeTruthy();
    expect(post!.sections?.length).toBeGreaterThan(0);
    expect(post!.sections?.some((section) => section.title.includes("Источники"))).toBe(true);
    for (const block of mapBlocks) {
      expect(block).not.toContain(`"${slug}"`);
    }
  });

  it("wires migrated posts through typed modules", () => {
    expect(blogTs).toContain("ITINERARY_ZA_14_DNEY_POST");
    expect(blogTs).toContain("ITINERARY_ZA_10_DNEY_POST");
    expect(blogTs).toContain("ITINERARY_CHEK_LIST_POST");
    expect(blogTs).toContain("ITINERARY_OSHIBKI_POST");
    expect(blogTs).toContain("IGUAZU_ZA_3_DNYA_POST");
    expect(blogTs).toContain("PATAGONIA_AVIABILETY_POST");
    expect(blogTs).toContain("WILDLIFE_S_GIDOM_POST");
    expect(blogTs).toContain("PATAGONIA_PENGUINS_POST");
    expect(blogTs).toContain("PATAGONIA_WHALE_WATCHING_POST");
    expect(blogTs).toContain("IGUAZU_GARGANTA_DEL_DIABLO_POST");
    expect(blogTs).toContain("UCO_VALLEY_VINO_I_GORY_POST");
    expect(blogTs).not.toContain('id: "blog-itinerary-14-days"');
    expect(blogTs).not.toContain('id: "blog-patagonia-flights"');
    expect(blogTs).not.toContain('id: "blog-patagonia-penguins"');
    expect(blogTs).not.toContain('id: "blog-iguazu-garganta-del-diablo"');
    expect(blogTs).not.toContain('id: "blog-patagonia-whale-watching"');
    expect(blogTs).not.toContain('id: "blog-uco-valley"');
    expect(blogTs).not.toContain('id: "blog-wildlife-guide"');
  });

  it("legacyManual override maps are empty after wildlife / nature batch", () => {
    for (const block of mapBlocks) {
      expect(block).toMatch(/=\s*\{\s*\};?\s*$/);
      expect(block).not.toMatch(/"[^"]+":/);
    }
  });
});
