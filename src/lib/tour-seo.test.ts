import { describe, expect, it } from "vitest";
import { marketplaceTours } from "@/data/marketplace-tours";
import { buildTourSeoDescription, buildTourSeoTitle } from "./tour-seo";

describe("native tour SEO copy", () => {
  it("keeps public seed metadata readable and within the audit budgets", () => {
    for (const tour of marketplaceTours.slice(0, 6)) {
      const title = buildTourSeoTitle(tour);
      const description = buildTourSeoDescription(tour);
      expect(title.length).toBeGreaterThanOrEqual(20);
      expect(title.length).toBeLessThanOrEqual(45);
      expect(description.length).toBeGreaterThanOrEqual(70);
      expect(description.length).toBeLessThanOrEqual(160);
    }
  });
});
