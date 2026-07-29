import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchExcursionsResultServer } = vi.hoisted(() => ({
  fetchExcursionsResultServer: vi.fn(),
}));

vi.mock("@/lib/tripster/excursion-server", () => ({ fetchExcursionsResultServer }));

import { GET } from "./route";

const empty = { items: [], total: 0, page: 1, pageSize: 24, cities: [], catalogState: "empty" };

describe("GET /api/excursions", () => {
  beforeEach(() => fetchExcursionsResultServer.mockReset());

  it("returns 200 for a confirmed empty catalog", async () => {
    fetchExcursionsResultServer.mockResolvedValue({ status: "ok", data: empty });
    const response = await GET(new Request("http://localhost/api/excursions"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ total: 0, catalogState: "empty" });
  });

  it("returns 503 instead of a false empty catalog", async () => {
    fetchExcursionsResultServer.mockResolvedValue({
      status: "unavailable",
      retryable: true,
      errorClass: "db_unavailable",
      message: "all sources down",
    });
    const response = await GET(new Request("http://localhost/api/excursions"));
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    await expect(response.json()).resolves.toMatchObject({ code: "catalog_unavailable" });
  });
});
