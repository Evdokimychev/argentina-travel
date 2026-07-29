import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchExcursionDetailResultServer } = vi.hoisted(() => ({
  fetchExcursionDetailResultServer: vi.fn(),
}));

vi.mock("@/lib/tripster/excursion-server", () => ({ fetchExcursionDetailResultServer }));

import { GET } from "./route";

describe("GET /api/excursions/[slug]", () => {
  beforeEach(() => fetchExcursionDetailResultServer.mockReset());

  it("returns 404 only when absence is confirmed", async () => {
    fetchExcursionDetailResultServer.mockResolvedValue({ status: "ok", data: null });
    const response = await GET(new Request("http://localhost/api/excursions/missing"), {
      params: Promise.resolve({ slug: "missing" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 503 when detail sources are unavailable", async () => {
    fetchExcursionDetailResultServer.mockResolvedValue({
      status: "unavailable",
      retryable: true,
      errorClass: "network",
      message: "upstream down",
    });
    const response = await GET(new Request("http://localhost/api/excursions/demo"), {
      params: Promise.resolve({ slug: "demo" }),
    });
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    await expect(response.json()).resolves.toMatchObject({ code: "catalog_unavailable" });
  });
});
