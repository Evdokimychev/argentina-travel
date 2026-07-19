import { describe, expect, it } from "vitest";

import {
  fuzzyTokenMatches,
  normalizeSearchText,
  searchTextMatches,
} from "./normalize";

describe("search normalization", () => {
  it("normalizes Russian spelling and Spanish diacritics", () => {
    expect(normalizeSearchText("  Puerto Iguazú — Ёлка ")).toBe("puerto iguazu елка");
  });

  it("accepts a small typo in a meaningful token", () => {
    expect(fuzzyTokenMatches("ушуая", "ушуайя")).toBe(true);
    expect(searchTextMatches("Водопады Игуасу", "игусу")).toBe(true);
  });

  it("does not fuzzy-match short unrelated tokens", () => {
    expect(fuzzyTokenMatches("дом", "дни")).toBe(false);
  });
});
