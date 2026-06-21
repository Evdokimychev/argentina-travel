import { describe, expect, it } from "vitest";
import { siteRobotsMetadata } from "@/lib/cms/site-globals/robots-meta";

describe("siteRobotsMetadata", () => {
  it("allows indexing when enabled", () => {
    expect(siteRobotsMetadata(true)).toEqual({ index: true, follow: true });
  });

  it("blocks indexing when disabled", () => {
    const robots = siteRobotsMetadata(false);
    expect(robots).toMatchObject({
      index: false,
      follow: false,
      nocache: true,
    });
    expect(robots).toHaveProperty("googleBot");
  });
});
