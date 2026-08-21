import { describe, expect, it } from "vitest";

import { JOIN_AUTHORS } from "@/data/join-page";

describe("join page author media", () => {
  it("provides a non-empty image for every author card", () => {
    expect(JOIN_AUTHORS.length).toBeGreaterThan(0);
    for (const author of JOIN_AUTHORS) {
      expect(author.image.trim().length, author.id).toBeGreaterThan(0);
      expect(author.image.startsWith("/"), author.id).toBe(true);
    }
  });
});
