import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listComments: vi.fn(),
  fetchSiteModules: vi.fn(),
  fetchSiteNavigation: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/lib/auth-mode", () => ({
  isSupabaseAuthEnabled: () => true,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

vi.mock("@/lib/blog-comments-server", () => ({
  createBlogArticleComment: vi.fn(),
  listBlogArticleComments: mocks.listComments,
}));

vi.mock("@/lib/site-settings-server", () => ({
  fetchSiteModules: mocks.fetchSiteModules,
  fetchSiteNavigation: mocks.fetchSiteNavigation,
}));

import { GET, POST } from "./route";

describe("blog comments API", () => {
  beforeEach(() => {
    mocks.listComments.mockReset();
    mocks.fetchSiteModules.mockReset();
    mocks.fetchSiteModules.mockResolvedValue({
      publicModules: {
        journal: {
          activated: true,
          published: true,
          includeInSearch: true,
          includeInSitemap: true,
        },
      },
    });
    mocks.fetchSiteNavigation.mockReset();
    mocks.fetchSiteNavigation.mockResolvedValue({ showJournal: true });
    mocks.warn.mockReset();
    vi.spyOn(console, "warn").mockImplementation(mocks.warn);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps an article readable when comments storage is unavailable", async () => {
    mocks.listComments.mockRejectedValue(new Error("database unavailable"));

    const response = await GET(
      new Request("https://www.goargentina.ru/api/blog/comments?slug=buenos-aires-rajony"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-goargentina-degraded")).toBe("blog-comments");
    await expect(response.json()).resolves.toEqual({ comments: [] });
    expect(mocks.warn).toHaveBeenCalledOnce();
  });

  it("rejects a new comment before auth or storage when the blog is disabled", async () => {
    mocks.fetchSiteModules.mockResolvedValue({
      publicModules: {
        journal: {
          activated: false,
          published: true,
          includeInSearch: true,
          includeInSitemap: true,
        },
      },
    });

    const response = await POST(
      new Request("https://www.goargentina.ru/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "buenos-aires-rajony", body: "Комментарий" }),
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Блог отключён" });
    expect(mocks.listComments).not.toHaveBeenCalled();
  });
});
