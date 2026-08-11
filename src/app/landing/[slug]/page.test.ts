import { afterEach, describe, expect, it, vi } from "vitest";

import { CmsPublicContentUnavailableError } from "@/lib/cms/public-read-result";

const { listPublishedLandingSlugs } = vi.hoisted(() => ({
  listPublishedLandingSlugs: vi.fn(),
}));

vi.mock("@/lib/cms/landing-resolver", () => ({
  listPublishedLandingSlugs,
  resolveLandingPage: vi.fn(),
}));

import { generateStaticParams } from "./page";

describe("landing static params", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    listPublishedLandingSlugs.mockReset();
  });

  it("maps published CMS slugs when the catalog is available", async () => {
    listPublishedLandingSlugs.mockResolvedValue(["one", "two"]);

    await expect(generateStaticParams()).resolves.toEqual([
      { slug: "one" },
      { slug: "two" },
    ]);
  });

  it("keeps the build viable during a typed CMS outage", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    listPublishedLandingSlugs.mockRejectedValue(
      new CmsPublicContentUnavailableError("network"),
    );

    await expect(generateStaticParams()).resolves.toEqual([]);
  });

  it("does not hide unknown build failures", async () => {
    listPublishedLandingSlugs.mockRejectedValue(new Error("invalid landing document"));

    await expect(generateStaticParams()).rejects.toThrow("invalid landing document");
  });
});
