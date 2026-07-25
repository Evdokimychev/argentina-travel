import { describe, expect, it } from "vitest";
import { landingPageFromCms, type CmsDocument } from "@/types/cms-content";
import { isCmsDocumentComplete } from "@/lib/cms/translation-status";

function landingDoc(overrides: Partial<CmsDocument> = {}): CmsDocument {
  return {
    id: "landing:spring-campaign:ru",
    docType: "landing",
    slug: "spring-campaign",
    locale: "ru",
    title: "Весенняя кампания",
    status: "published",
    body: {
      kind: "landing",
      description: "Маркетинговая страница сезона",
      category: "Кампания",
      sections: [
        {
          heading: "Почему сейчас",
          paragraphs: ["Лучшее время для поездки в Патагонию."],
        },
      ],
    },
    seo: { description: "Весенние туры" },
    publishedAt: "2026-07-25T00:00:00.000Z",
    scheduledPublishAt: null,
    createdBy: null,
    updatedBy: null,
    rowVersion: 1,
    createdAt: "2026-07-25T00:00:00.000Z",
    updatedAt: "2026-07-25T00:00:00.000Z",
    ...overrides,
  };
}

describe("landing CMS model", () => {
  it("maps published landing documents to ContentPage with landing section", () => {
    const page = landingPageFromCms(landingDoc());
    expect(page).toMatchObject({
      slug: "spring-campaign",
      section: "landing",
      title: "Весенняя кампания",
      category: "Кампания",
    });
    expect(page?.sections[0]?.heading).toBe("Почему сейчас");
  });

  it("treats empty landing body as incomplete", () => {
    expect(
      isCmsDocumentComplete(
        landingDoc({
          body: { kind: "landing", description: "", sections: [] },
        }),
      ),
    ).toBe(false);
    expect(isCmsDocumentComplete(landingDoc())).toBe(true);
  });
});
