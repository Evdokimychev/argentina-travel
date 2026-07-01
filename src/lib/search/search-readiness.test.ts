import { describe, expect, it } from "vitest";
import { parseContentSlugList } from "@/lib/cms-content-cross-links";

describe("search-readiness helpers", () => {
  it("parseContentSlugList handles empty input", () => {
    expect(parseContentSlugList(undefined)).toEqual([]);
    expect(parseContentSlugList("   ")).toEqual([]);
  });
});
