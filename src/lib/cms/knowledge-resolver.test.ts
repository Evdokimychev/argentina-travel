import { describe, expect, it } from "vitest";
import {
  getCmsKnowledgePublicationIssues,
  isCmsKnowledgeContentReady,
  isCmsKnowledgePublicDocument,
  knowledgeEntryFromCms,
  mergeKnowledgeCatalog,
} from "@/lib/cms/knowledge-resolver";
import type { KbEntry } from "@/lib/knowledge-base/types";
import type { CmsBlogBody, CmsDocument } from "@/types/cms-content";

const longBody = `Начните с центра города. ${Array.from(
  { length: 620 },
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
      editorial: { word_count: 624, source_count: 1 },
    });
  });

  it("does not treat ordinary blog documents as KB pages", () => {
    expect(knowledgeEntryFromCms({ ...document, docType: "blog" })).toBeNull();
  });

  it("maps an explicitly verified personal byline from the CMS", () => {
    const entry = knowledgeEntryFromCms({
      ...document,
      body: {
        ...knowledgeBody,
        authorName: "Иван",
        authorSlug: "ivan",
        authorBio: "Автор проекта.",
        authorAvatar: "/media/authors/ivan.jpg",
        personalExperience: true,
        verifiedByAuthor: true,
      },
    });

    expect(entry).toMatchObject({
      author_name: "Иван",
      author_slug: "ivan",
      author_bio: "Автор проекта.",
      author_avatar: "/media/authors/ivan.jpg",
      personal_experience: true,
      verified_by_ivan: true,
    });
  });

  it("blocks a CMS byline until personal authorship is explicitly verified", () => {
    const unverified = {
      ...document,
      body: {
        ...knowledgeBody,
        authorName: "Иван",
        authorSlug: "ivan",
      },
    } satisfies CmsDocument;

    expect(getCmsKnowledgePublicationIssues(unverified)).toContain(
      "unverified_personal_authorship",
    );
    expect(isCmsKnowledgePublicDocument(unverified)).toBe(false);
  });

  it("preserves absent fallback authorship but honors explicit clearing", () => {
    const fallback: KbEntry = {
      id: document.slug,
      type: "author_tip",
      title: document.title,
      body: longBody,
      status: "published",
      site_ready: true,
      author_name: "Иван",
      author_slug: "ivan",
      personal_experience: true,
      verified_by_ivan: true,
    };

    expect(knowledgeEntryFromCms(document, fallback)).toMatchObject({
      author_name: "Иван",
      personal_experience: true,
      verified_by_ivan: true,
    });
    expect(
      knowledgeEntryFromCms(
        {
          ...document,
          body: {
            ...knowledgeBody,
            authorName: "",
            personalExperience: false,
            verifiedByAuthor: false,
          },
        },
        fallback,
      ),
    ).toMatchObject({
      author_name: undefined,
      personal_experience: false,
      verified_by_ivan: false,
    });
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

  it("does not let a CMS publication resurrect an archived knowledge slug", () => {
    expect(
      mergeKnowledgeCatalog([], [document], new Set([document.slug])),
    ).toEqual([]);
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
    const noIndex = { ...document, seo: { noIndex: true } } satisfies CmsDocument;

    expect(isCmsKnowledgeContentReady(noIndex)).toBe(true);
    expect(isCmsKnowledgePublicDocument(noIndex)).toBe(false);
  });

  it("does not let noindex bypass the content publication gate", () => {
    const unverifiedNoIndex = {
      ...document,
      seo: { noIndex: true },
      body: { ...knowledgeBody, authorName: "Иван" },
    } satisfies CmsDocument;

    expect(isCmsKnowledgeContentReady(unverifiedNoIndex)).toBe(false);
    expect(isCmsKnowledgePublicDocument(unverifiedNoIndex)).toBe(false);
  });
});
