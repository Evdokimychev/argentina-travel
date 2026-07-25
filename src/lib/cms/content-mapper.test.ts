import { describe, expect, it } from "vitest";

import { rowToCmsDocument } from "@/lib/cms/content-mapper";
import type { Database } from "@/types/database";

type ContentDocumentRow = Database["public"]["Tables"]["content_documents"]["Row"];

const row: ContentDocumentRow = {
  id: "knowledge:test:ru",
  doc_type: "knowledge",
  slug: "test",
  locale: "ru",
  title: "Материал",
  status: "draft",
  body: {
    kind: "blog",
    content: "Текст",
    relatedDestinations: ["buenos-aires", "mendoza"],
    authorName: "",
    personalExperience: false,
    verifiedByAuthor: false,
  },
  seo: {},
  published_at: null,
  scheduled_publish_at: null,
  workflow_stage: "draft",
  risk_level: "low",
  reviewer_id: null,
  last_fact_checked_at: null,
  next_review_at: null,
  last_substantive_update_at: null,
  schema_version: 1,
  created_by: null,
  updated_by: null,
  row_version: 1,
  created_at: "2026-07-20T00:00:00.000Z",
  updated_at: "2026-07-20T00:00:00.000Z",
};

describe("content mapper", () => {
  it("keeps knowledge byline tri-state and related destinations on DB round-trip", () => {
    expect(rowToCmsDocument(row).body).toMatchObject({
      kind: "blog",
      relatedDestinations: ["buenos-aires", "mendoza"],
      authorName: "",
      personalExperience: false,
      verifiedByAuthor: false,
    });
  });

  it("parses destination and place page-builder sections from JSONB", () => {
    const destinationRow: ContentDocumentRow = {
      ...row,
      id: "destination:patagonia:ru",
      doc_type: "destination",
      slug: "patagonia",
      body: {
        kind: "destination",
        description: "Патагония",
        sections: [
          {
            heading: "Практика",
            blocks: [{ type: "callout", variant: "info", title: "Совет", body: "Берите слойность." }],
          },
        ],
      },
    };
    const placeRow: ContentDocumentRow = {
      ...row,
      id: "place:perito:ru",
      doc_type: "place",
      slug: "perito-moreno-glacier",
      body: {
        kind: "place",
        shortDescription: "Ледник",
        fullDescription: "Полное описание",
        sections: [{ heading: "Как добраться", paragraphs: ["Из Эль-Калафате."] }],
      },
    };
    const landingRow: ContentDocumentRow = {
      ...row,
      id: "landing:spring:ru",
      doc_type: "landing",
      slug: "spring-campaign",
      body: {
        kind: "landing",
        description: "Весенняя кампания",
        sections: [{ heading: "Оффер", paragraphs: ["Скидка на туры."] }],
      },
    };

    expect(rowToCmsDocument(destinationRow).body).toMatchObject({
      kind: "destination",
      sections: [{ heading: "Практика" }],
    });
    expect(rowToCmsDocument(placeRow).body).toMatchObject({
      kind: "place",
      sections: [{ heading: "Как добраться", paragraphs: ["Из Эль-Калафате."] }],
    });
    expect(rowToCmsDocument(landingRow).body).toMatchObject({
      kind: "landing",
      description: "Весенняя кампания",
      sections: [{ heading: "Оффер" }],
    });
  });
});
