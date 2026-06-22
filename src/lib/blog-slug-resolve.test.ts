import { describe, expect, it } from "vitest";
import {
  blogSlugLookupCandidates,
  blogPostPath,
  buildPublishedBlogSlugSet,
  canonicalBlogSlug,
  isBlogSlugPublished,
  areBlogSlugsEquivalent,
} from "@/lib/blog-slug-resolve";

describe("blogSlugLookupCandidates", () => {
  it("maps latin media alias to cyrillic editorial slug", () => {
    expect(blogSlugLookupCandidates("itinerary-oshibki")).toContain("itinerary-ошибки");
  });

  it("maps cyrillic slug to latin alias", () => {
    expect(blogSlugLookupCandidates("itinerary-ошибки")).toContain("itinerary-oshibki");
  });
});

describe("canonicalBlogSlug", () => {
  it("returns TS slug for cyrillic editorial post", () => {
    expect(canonicalBlogSlug("itinerary-ошибки")).toBe("itinerary-ошибки");
  });
});

describe("blogPostPath", () => {
  it("percent-encodes cyrillic slugs for Location headers", () => {
    expect(blogPostPath("itinerary-ошибки")).toBe(
      "/blog/itinerary-%D0%BE%D1%88%D0%B8%D0%B1%D0%BA%D0%B8",
    );
  });

  it("leaves ascii slugs unchanged", () => {
    expect(blogPostPath("argentinian-steak-guide")).toBe("/blog/argentinian-steak-guide");
  });
});

describe("areBlogSlugsEquivalent", () => {
  it("treats latin alias and cyrillic slug as the same post", () => {
    expect(areBlogSlugsEquivalent("itinerary-oshibki", "itinerary-ошибки")).toBe(true);
  });
});

describe("published slug set", () => {
  it("treats alias slugs as published when catalog uses latin slug", () => {
    const published = buildPublishedBlogSlugSet(["itinerary-oshibki"]);
    expect(isBlogSlugPublished("itinerary-ошибки", published)).toBe(true);
    expect(isBlogSlugPublished("itinerary-oshibki", published)).toBe(true);
    expect(isBlogSlugPublished("missing-slug", published)).toBe(false);
  });
});
