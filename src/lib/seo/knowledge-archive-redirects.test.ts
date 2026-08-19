import { describe, expect, it } from "vitest";
import { loadKnowledgeArchiveRedirects } from "@/lib/seo/knowledge-archive-redirects";

describe("knowledge archive redirects", () => {
  it("sends the old visa FAQ slug to the canonical border article", () => {
    const redirects = loadKnowledgeArchiveRedirects();
    expect(redirects).toContainEqual({
      source: "/baza-znaniy/viza-rf-v-argentinu",
      destination: "/baza-znaniy/viza-i-granica-dlya-rossiyan",
      permanent: true,
    });
  });

  it("does not catch-all archive URLs onto the homepage", () => {
    const redirects = loadKnowledgeArchiveRedirects();
    expect(redirects.every((rule) => rule.destination !== "/")).toBe(true);
    expect(redirects.every((rule) => rule.destination.startsWith("/baza-znaniy/"))).toBe(true);
  });
});
