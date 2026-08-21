import { beforeEach, describe, expect, it, vi } from "vitest";
import { CmsPublicContentUnavailableError } from "@/lib/cms/public-read-result";

const mocks = vi.hoisted(() => ({
  resolveOverride: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache:
    <T>(operation: () => Promise<T>) =>
    async () =>
      operation(),
}));

vi.mock("@/lib/cms/cms-cutover", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/cms/cms-cutover")>();
  return {
    ...original,
    getCmsCutoverFlags: async () => ({
      blog: false,
      guide: false,
      destination: false,
      place: false,
    }),
  };
});

vi.mock("@/lib/cms/content-resolver", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/cms/content-resolver")>();
  const { buildDefaultTranslationStatus } = await import("@/lib/cms/translation-status");
  return {
    ...original,
    getCmsServerClient: async () => ({ from: vi.fn() }),
    resolveWithPublishedCmsOverride: mocks.resolveOverride,
    fetchCmsTranslationStatusForSlug: async () => buildDefaultTranslationStatus(false),
    fetchPublishedCmsDocumentsMergedByLocaleChain: async () => [],
  };
});

import { resolveBlogPost } from "@/lib/cms/blog-resolver";

describe("resolveBlogPost detail outage", () => {
  beforeEach(() => {
    mocks.resolveOverride.mockReset();
  });

  it("does not throw when CMS is down for a slug without a seed fallback", async () => {
    mocks.resolveOverride.mockRejectedValue(
      new CmsPublicContentUnavailableError("db_unavailable"),
    );

    await expect(resolveBlogPost("cms-only-missing-seed-article")).resolves.toBeUndefined();
  });

  it("still returns the seed article when the override helper returns the fallback", async () => {
    mocks.resolveOverride.mockImplementation(async ({ fallback }) => fallback);

    const post = await resolveBlogPost("best-time-to-visit-argentina");
    expect(post?.slug).toBe("best-time-to-visit-argentina");
    expect(post?.title).toBeTruthy();
  });
});
