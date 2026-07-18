import { describe, expect, it } from "vitest";
import { parseKnowledgePackage } from "@/lib/cms/knowledge-import";

const validPackage = {
  schema: "argentina-travel-knowledge-v2",
  export_id: "test-export",
  generated_at: "2026-07-16T12:00:00Z",
  producer: "argentina-knowledge-collector",
  articles: [
    {
      id: "telegram:vista_argentina:10",
      fingerprint: "abc123",
      slug: "mendoza-abc12345",
      locale: "ru",
      title: "Гид по Мендосе",
      summary: "Практический материал о Мендосе.",
      editorial_status: "accepted",
      body: {
        kind: "blog",
        excerpt: "Практический материал о Мендосе.",
        content: "Мендоса находится в Аргентине. Здесь собраны советы для поездки.",
        sections: [{ title: "Основное", body: "Мендоса находится в Аргентине." }],
        collector: {
          schemaVersion: 2,
          identity: "telegram:vista_argentina:10",
          source: "telegram",
          sourceId: "vista_argentina",
          sourceItemId: 10,
          fingerprint: "abc123",
          qualityScore: 78,
          scoreBreakdown: { relevance: 25 },
          flags: [],
          tags: ["Mendoza"],
          media: [],
        },
      },
      seo: { description: "Практический материал о Мендосе.", noIndex: true },
    },
  ],
};

describe("parseKnowledgePackage", () => {
  it("normalizes a collector package into CMS draft data", () => {
    const result = parseKnowledgePackage(validPackage);

    expect(result.errors).toEqual([]);
    expect(result.value?.candidates).toHaveLength(1);
    expect(result.value?.candidates[0].body.collector?.qualityScore).toBe(78);
    expect(result.value?.candidates[0].seo.noIndex).toBe(true);
  });

  it("rejects unsupported package schemas", () => {
    const result = parseKnowledgePackage({ ...validPackage, schema: "legacy-v1" });

    expect(result.value).toBeNull();
    expect(result.errors[0].message).toContain("Неподдерживаемая схема");
  });
});
