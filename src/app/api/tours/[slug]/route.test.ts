import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchTourDetailBySlugResultServer } = vi.hoisted(() => ({
  fetchTourDetailBySlugResultServer: vi.fn(),
}));

vi.mock("@/lib/auth-mode", () => ({ isSupabaseToursEnabled: () => true }));
vi.mock("@/lib/tour-content-server", () => ({ fetchTourDetailBySlugResultServer }));

import { GET } from "./route";

describe("GET /api/tours/[slug]", () => {
  beforeEach(() => fetchTourDetailBySlugResultServer.mockReset());

  it("returns 404 only for confirmed absence", async () => {
    fetchTourDetailBySlugResultServer.mockResolvedValue({ status: "ok", data: null });
    const response = await GET(new Request("http://localhost/api/tours/missing"), {
      params: Promise.resolve({ slug: "missing" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 503 for a dependency failure", async () => {
    fetchTourDetailBySlugResultServer.mockResolvedValue({
      status: "unavailable",
      retryable: true,
      errorClass: "db_unavailable",
      message: "database down",
    });
    const response = await GET(new Request("http://localhost/api/tours/demo"), {
      params: Promise.resolve({ slug: "demo" }),
    });
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
  });
});
