import { describe, expect, it } from "vitest";
import { buildCmsSeedEntries, enrichSeedBodyWithRichHtml } from "@/lib/cms/cms-ts-seed";
import { computeCmsImportPreview } from "@/lib/cms/cms-import-preview";
import { cmsDocumentId } from "@/types/cms-content";

describe("enrichSeedBodyWithRichHtml", () => {
  it("adds html to legal sections from paragraphs", () => {
    const legalEntry = buildCmsSeedEntries().find((entry) => entry.docType === "legal");
    expect(legalEntry).toBeDefined();
    if (!legalEntry || legalEntry.body.kind !== "legal") return;

    const enriched = enrichSeedBodyWithRichHtml(legalEntry.body);
    expect(enriched.kind).toBe("legal");
    if (enriched.kind !== "legal") return;

    const withParagraphs = enriched.sections.find((section) => section.paragraphs?.length);
    expect(withParagraphs?.html).toContain("<p>");
  });

  it("adds html to guide sections from paragraphs", () => {
    const guideEntry = buildCmsSeedEntries().find((entry) => entry.docType === "guide");
    expect(guideEntry).toBeDefined();
    if (!guideEntry || guideEntry.body.kind !== "guide") return;

    const enriched = enrichSeedBodyWithRichHtml(guideEntry.body);
    if (enriched.kind !== "guide") return;

    const withParagraphs = enriched.sections.find((section) => section.paragraphs?.length);
    expect(withParagraphs?.html).toContain("<p>");
  });

  it("leaves blog body unchanged", () => {
    const blogEntry = buildCmsSeedEntries().find((entry) => entry.docType === "blog");
    expect(blogEntry).toBeDefined();
    if (!blogEntry) return;
    expect(enrichSeedBodyWithRichHtml(blogEntry.body)).toEqual(blogEntry.body);
  });
});

describe("computeCmsImportPreview", () => {
  it("counts create/skip/update actions", () => {
    const entries = buildCmsSeedEntries().slice(0, 3);
    const existingIds = new Map<string, { status: string }>([
      [cmsDocumentId(entries[0]!.docType, entries[0]!.slug, "ru"), { status: "published" }],
    ]);

    const skipPreview = computeCmsImportPreview(entries, existingIds, true);
    expect(skipPreview.wouldCreate).toBe(2);
    expect(skipPreview.wouldSkip).toBe(1);

    const forcePreview = computeCmsImportPreview(entries, existingIds, false);
    expect(forcePreview.wouldCreate).toBe(2);
    expect(forcePreview.wouldUpdate).toBe(1);
  });
});
