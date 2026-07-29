import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

const mocks = vi.hoisted(() => ({
  listComments: vi.fn(),
  fetchSiteModules: vi.fn(),
  fetchSiteNavigation: vi.fn(),
  error: vi.fn(),
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
    mocks.error.mockReset();
    vi.spyOn(console, "error").mockImplementation(mocks.error);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns retryable unavailable instead of a false empty comment list", async () => {
    mocks.listComments.mockRejectedValue(new Error("database unavailable provider secret"));

    const response = await GET(
      new Request("https://www.goargentina.ru/api/blog/comments?slug=buenos-aires-rajony"),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("x-goargentina-degraded")).toBe("blog-comments");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("retry-after")).toBe("60");
    await expect(response.json()).resolves.toEqual({
      error: "Комментарии временно недоступны",
    });
    expect(mocks.error).toHaveBeenCalledOnce();
    expect(JSON.stringify(mocks.error.mock.calls)).not.toContain("provider secret");
  });

  it("keeps a confirmed empty comment list distinct from unavailable", async () => {
    mocks.listComments.mockResolvedValue([]);

    const response = await GET(
      new Request("https://www.goargentina.ru/api/blog/comments?slug=buenos-aires-rajony"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-goargentina-degraded")).toBeNull();
    await expect(response.json()).resolves.toEqual({ comments: [] });
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

  it("shows an unavailable state with retry instead of the confirmed-empty copy", () => {
    const component = fs.readFileSync(
      path.join(process.cwd(), "src/components/blog/BlogCommentsSection.tsx"),
      "utf8",
    );
    expect(component).toContain("commentsUnavailable");
    expect(component).toContain("Комментарии временно недоступны");
    expect(component).toContain("Повторить загрузку");
    expect(component.indexOf("commentsUnavailable ?")).toBeLessThan(
      component.indexOf("comments.length === 0 ?"),
    );
  });
});
