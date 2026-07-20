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
});
