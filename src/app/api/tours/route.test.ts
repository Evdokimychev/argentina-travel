import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchPublishedListingsResultServer } = vi.hoisted(() => ({
  fetchPublishedListingsResultServer: vi.fn(),
}));

vi.mock("@/lib/auth-mode", () => ({ isSupabaseToursEnabled: () => true }));
vi.mock("@/lib/tour-content-server", () => ({ fetchPublishedListingsResultServer }));

import { GET } from "./route";

describe("GET /api/tours", () => {
  beforeEach(() => fetchPublishedListingsResultServer.mockReset());

  it("keeps a confirmed empty catalog as 200", async () => {
    fetchPublishedListingsResultServer.mockResolvedValue({ status: "ok", data: [] });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ tours: [] });
  });

  it("returns 503 when the catalog dependency is unavailable", async () => {
    fetchPublishedListingsResultServer.mockResolvedValue({
      status: "unavailable",
      retryable: true,
      errorClass: "db_unavailable",
      message: "database down",
    });
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    await expect(response.json()).resolves.toEqual({ error: "Tours API unavailable" });
  });
});
