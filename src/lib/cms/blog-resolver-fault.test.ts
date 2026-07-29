import { beforeEach, describe, expect, it, vi } from "vitest";
import { blogPosts } from "@/data/blog";
import { filterPublicBlogCatalog } from "@/lib/blog-utils";
import { CmsPublicContentUnavailableError } from "@/lib/cms/public-read-result";

const mocks = vi.hoisted(() => ({
  fetchMerged: vi.fn(),
  cache: new Map<string, unknown>(),
}));

vi.mock("next/cache", () => ({
  unstable_cache:
    <T>(operation: () => Promise<T>, key: string[]) =>
    async () => {
      const cacheKey = JSON.stringify(key);
      if (mocks.cache.has(cacheKey)) return mocks.cache.get(cacheKey) as T;
      const value = await operation();
      mocks.cache.set(cacheKey, value);
      return value;
    },
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
  return {
    ...original,
    getCmsServerClient: async () => ({ from: vi.fn() }),
    fetchPublishedCmsDocumentsMergedByLocaleChain: mocks.fetchMerged,
  };
});

import { resolveBlogCatalog } from "@/lib/cms/blog-resolver";

describe("blog CMS cache recovery", () => {
  beforeEach(() => {
    mocks.fetchMerged.mockReset();
    mocks.cache.clear();
  });

  it("returns reviewed fallback outside the cache and retries CMS immediately after recovery", async () => {
    mocks.fetchMerged
      .mockRejectedValueOnce(new CmsPublicContentUnavailableError("quota"))
      .mockResolvedValueOnce([]);

    const fallback = filterPublicBlogCatalog(blogPosts);
    await expect(resolveBlogCatalog("ru")).resolves.toEqual(fallback);
    await expect(resolveBlogCatalog("ru")).resolves.toEqual(fallback);

    expect(mocks.fetchMerged).toHaveBeenCalledTimes(2);
  });
});
