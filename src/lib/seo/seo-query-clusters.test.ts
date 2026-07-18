import { describe, expect, it } from "vitest";
import { SEO_QUERY_CLUSTERS } from "@/data/seo-query-clusters";

describe("SEO query clusters", () => {
  it("uses unique cluster ids and valid target paths", () => {
    expect(new Set(SEO_QUERY_CLUSTERS.map((cluster) => cluster.id)).size).toBe(SEO_QUERY_CLUSTERS.length);
    for (const cluster of SEO_QUERY_CLUSTERS) {
      expect(cluster.targetPath).toMatch(/^\/[a-z0-9а-яё/_-]+$/iu);
      expect(cluster.queries.length).toBeGreaterThanOrEqual(4);
      expect(cluster.promise.length).toBeGreaterThan(40);
    }
  });

  it("does not invent search-volume estimates", () => {
    expect(JSON.stringify(SEO_QUERY_CLUSTERS)).not.toMatch(/volume|частотност|тыс\. запрос/iu);
  });
});
