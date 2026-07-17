import { describe, expect, it } from "vitest";
import { knowledgeEntryFromCms, mergeKnowledgeCatalog } from "@/lib/cms/knowledge-resolver";
import type { KbEntry } from "@/lib/knowledge-base/types";
import type { CmsDocument } from "@/types/cms-content";

const document: CmsDocument = {
  id: "knowledge:mendoza-guide:ru",
  docType: "knowledge",
  slug: "mendoza-guide",
  locale: "ru",
  title: "Гид по Мендосе",
  status: "published",
  body: {
    kind: "blog",
    excerpt: "Практический материал.",
    sections: [{ title: "Маршрут", body: "Начните с центра города." }],
    collector: {
      schemaVersion: 2,
      identity: "mendoza-guide",
      source: "collector",
      sourceId: "mendoza",
      sourceItemId: 1,
      sourceUrl: "https://example.com/mendoza",
      fingerprint: "abc",
      qualityScore: 86,
      scoreBreakdown: {},
      flags: [],
      category: "puteshestviya",
      province: "Mendoza",
      tags: ["вино"],
      media: [],
    },
  },
  seo: { description: "SEO description" },
  publishedAt: "2026-07-17T00:00:00.000Z",
  scheduledPublishAt: null,
  createdBy: null,
  updatedBy: null,
  rowVersion: 1,
  createdAt: "2026-07-16T00:00:00.000Z",
  updatedAt: "2026-07-17T00:00:00.000Z",
};

describe("knowledgeEntryFromCms", () => {
  it("maps a dedicated knowledge document to the public KB contract", () => {
    expect(knowledgeEntryFromCms(document)).toMatchObject({
      id: "mendoza-guide",
      type: "guide",
      title: "Гид по Мендосе",
      summary: "Практический материал.",
      site_sections: ["puteshestviya-po-argentine"],
      province: "Mendoza",
      confidence: "high",
      body: "## Маршрут\n\nНачните с центра города.",
    });
  });

  it("does not treat ordinary blog documents as KB pages", () => {
    expect(knowledgeEntryFromCms({ ...document, docType: "blog" })).toBeNull();
  });

  it("merges publications into the catalog and excludes noindex overrides", () => {
    const fallback: KbEntry = {
      id: "legacy-guide",
      type: "guide",
      title: "Старый гид",
      body: "Старый текст",
      status: "published",
      site_ready: true,
    };
    const noIndexOverride: CmsDocument = {
      ...document,
      id: "knowledge:legacy-guide:ru",
      slug: "legacy-guide",
      seo: { noIndex: true },
    };

    expect(mergeKnowledgeCatalog([fallback], [document, noIndexOverride])).toEqual([
      expect.objectContaining({ id: "mendoza-guide", title: "Гид по Мендосе" }),
    ]);
  });
});
