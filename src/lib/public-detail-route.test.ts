import { describe, expect, it } from "vitest";

import { matchPublicDetailPath } from "./public-detail-route";

describe("public detail route matching", () => {
  it("matches real public detail routes", () => {
    expect(matchPublicDetailPath("/blog/patagonia-guide")).toEqual({
      kind: "blog",
      slug: "patagonia-guide",
    });
    expect(matchPublicDetailPath("/places/ushuaia")).toEqual({
      kind: "places",
      slug: "ushuaia",
    });
  });

  it("does not treat reserved blog pages as article slugs", () => {
    expect(matchPublicDetailPath("/blog/authors")).toBeNull();
    expect(matchPublicDetailPath("/blog/feed.xml")).toBeNull();
  });
});
