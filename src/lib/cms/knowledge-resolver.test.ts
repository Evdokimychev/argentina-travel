import { describe, expect, it } from "vitest";
import {
  getCmsKnowledgePublicationIssues,
  isCmsKnowledgePublicDocument,
  knowledgeEntryFromCms,
  mergeKnowledgeCatalog,
} from "@/lib/cms/knowledge-resolver";
import type { KbEntry } from "@/lib/knowledge-base/types";
import type { CmsBlogBody, CmsDocument } from "@/types/cms-content";

const longBody = `Начните с центра города. ${Array.from(
  { length: 125 },
  (_, index) => `рекомендация${index + 1}`,
).join(" ")}`;

const knowledgeBody: CmsBlogBody = {
  kind: "blog",
  excerpt: "Практический материал.",
  content: longBody,
  sections: [{ title: "Маршрут", body: longBody }],
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
};

const document: CmsDocument = {
  id: "knowledge:mendoza-guide:ru",
  docType: "knowledge",
  slug: "mendoza-guide",
  locale: "ru",
  title: "Гид по Мендосе",
  status: "published",
  body: knowledgeBody,
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
    const entry = knowledgeEntryFromCms(document);
    expect(entry).toMatchObject({
      id: "mendoza-guide",
      type: "guide",
      title: "Гид по Мендосе",
      summary: "Практический материал.",
      site_sections: ["puteshestviya-po-argentine"],
      province: "Mendoza",
      confidence: "high",
      body: longBody,
      editorial: { word_count: 129, source_count: 1 },
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

  it("keeps thin or source-less CMS knowledge drafts out of the public catalog", () => {
    const thin = {
      ...document,
      slug: "thin-guide",
      id: "knowledge:thin-guide:ru",
      body: {
        ...knowledgeBody,
        content: "Слишком короткий текст.",
        sections: [{ title: "Коротко", body: "Слишком короткий текст." }],
      },
    } satisfies CmsDocument;
    const sourceLess = {
      ...document,
      slug: "source-less-guide",
      id: "knowledge:source-less-guide:ru",
      body: {
        ...knowledgeBody,
        collector: { ...knowledgeBody.collector!, sourceUrl: undefined },
      },
    } satisfies CmsDocument;

    expect(getCmsKnowledgePublicationIssues(thin)).toContain("thin_content");
    expect(getCmsKnowledgePublicationIssues(sourceLess)).toContain("missing_source_provenance");
    expect(mergeKnowledgeCatalog([], [thin, sourceLess])).toEqual([]);
  });

  it("requires a new fact-check before a sensitive fallback body can be changed", () => {
    const sensitiveFallback: KbEntry = {
      id: document.slug,
      type: "guide",
      title: document.title,
      body: longBody,
      status: "published",
      site_ready: true,
      sources: [{ id: "official", title: "Официальный источник", url: "https://example.com" }],
      editorial: {
        sensitive: true,
        provenance: {
          schema_version: 1,
          applicable: true,
          declared: true,
          mode: "strict",
          strict_ready: true,
          issue_count: 0,
          issue_codes: [],
          source_count: 1,
          identified_source_count: 1,
          claim_count: 1,
          sensitive_claim_count: 1,
          stale_after_days: 45,
        },
      },
    };
    const changed = {
      ...document,
      body: { ...knowledgeBody, content: `${longBody} Изменённый факт.` },
    } satisfies CmsDocument;

    expect(getCmsKnowledgePublicationIssues(changed, sensitiveFallback)).toContain(
      "sensitive_claim_review_required",
    );
    expect(isCmsKnowledgePublicDocument(changed, sensitiveFallback)).toBe(false);
  });

  it("never exposes an explicitly noindex CMS knowledge document", () => {
    expect(isCmsKnowledgePublicDocument({ ...document, seo: { noIndex: true } })).toBe(false);
  });
});
