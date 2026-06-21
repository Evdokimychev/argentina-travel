import { describe, expect, it } from "vitest";
import { mergeCmsDocumentWithPreviewDraft } from "@/lib/cms/cms-preview";
import type { CmsDocument } from "@/types/cms-content";

const baseDoc: CmsDocument = {
  id: "guide:test:ru",
  docType: "guide",
  slug: "test",
  locale: "ru",
  title: "Saved title",
  status: "draft",
  body: {
    kind: "guide",
    description: "Saved description",
    sections: [{ heading: "H", html: "<p>saved</p>" }],
  },
  seo: {},
  publishedAt: null,
  scheduledPublishAt: null,
  createdBy: null,
  updatedBy: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("mergeCmsDocumentWithPreviewDraft", () => {
  it("returns saved document when draft is null", () => {
    expect(mergeCmsDocumentWithPreviewDraft(baseDoc, null)).toEqual(baseDoc);
  });

  it("overlays draft title and body", () => {
    const merged = mergeCmsDocumentWithPreviewDraft(baseDoc, {
      title: "Draft title",
      body: {
        kind: "guide",
        description: "Draft description",
        sections: [{ heading: "Draft", html: "<p>draft</p>" }],
      },
      seo: { title: "Draft SEO" },
    });

    expect(merged.title).toBe("Draft title");
    expect(merged.body).toEqual({
      kind: "guide",
      description: "Draft description",
      sections: [{ heading: "Draft", html: "<p>draft</p>" }],
    });
    expect(merged.seo.title).toBe("Draft SEO");
  });
});
