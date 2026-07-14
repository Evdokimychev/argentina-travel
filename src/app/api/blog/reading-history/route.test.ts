import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadSessionUser: vi.fn(),
  listRows: vi.fn(),
}));

vi.mock("@/lib/auth-mode", () => ({
  isSupabaseAuthEnabled: () => true,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({}),
}));

vi.mock("@/lib/supabase-auth-provider", () => ({
  loadSessionUserFromSupabase: mocks.loadSessionUser,
}));

vi.mock("@/lib/blog-reading-history-server", () => ({
  listUserBlogReadingHistoryRows: mocks.listRows,
  parseBlogReadingHistoryInput: vi.fn(),
  recordBlogReadInteraction: vi.fn(),
  rowsToBlogReadingHistory: vi.fn(),
  upsertBlogReadingHistoryRow: vi.fn(),
}));

import { GET } from "./route";

describe("blog reading history API", () => {
  beforeEach(() => {
    mocks.loadSessionUser.mockReset();
    mocks.listRows.mockReset();
  });

  it("returns an empty history for an anonymous reader without a 401", async () => {
    mocks.loadSessionUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ entries: [] });
    expect(mocks.listRows).not.toHaveBeenCalled();
  });
});
