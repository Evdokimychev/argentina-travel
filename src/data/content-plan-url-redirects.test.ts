import { describe, expect, it } from "vitest";
import {
  CONTENT_PLAN_URL_REDIRECTS,
  matchContentPlanRedirect,
} from "@/data/content-plan-url-redirects";

describe("matchContentPlanRedirect", () => {
  it("maps content-plan paths to canonical blog URLs", () => {
    expect(matchContentPlanRedirect("/marshruty/argentina-2-nedeli")).toBe(
      "/blog/argentina-2-nedeli-marshrut",
    );
    expect(matchContentPlanRedirect("/goroda/buenos-aires-rajony")).toBe(
      "/blog/buenos-aires-rajony",
    );
    expect(matchContentPlanRedirect("/pereezd/grazhdanstvo")).toBe(
      "/blog/grazhdanstvo-argentiny",
    );
  });

  it("strips trailing slash before lookup", () => {
    expect(matchContentPlanRedirect("/dengi/byudzhet-poezdki/")).toBe(
      "/blog/byudzhet-poezdki-argentina",
    );
  });

  it("redirects legacy blog slugs to new canonical posts", () => {
    expect(matchContentPlanRedirect("/blog/buenos-aires-neighborhoods")).toBe(
      "/blog/buenos-aires-rajony",
    );
    expect(matchContentPlanRedirect("/blog/mendoza-wine-route")).toBe(
      "/blog/mendoza-vinnyj-gid",
    );
  });

  it("returns null for unknown paths", () => {
    expect(matchContentPlanRedirect("/blog/unknown-slug")).toBeNull();
    expect(matchContentPlanRedirect("/")).toBeNull();
  });

  it("has unique source paths", () => {
    const sources = Object.keys(CONTENT_PLAN_URL_REDIRECTS);
    expect(new Set(sources).size).toBe(sources.length);
  });
});
