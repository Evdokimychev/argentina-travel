import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { authorizeAdminRequest, createTravelpayoutsPartnerLinks } = vi.hoisted(() => ({
  authorizeAdminRequest: vi.fn(),
  createTravelpayoutsPartnerLinks: vi.fn(),
}));

vi.mock("@/lib/admin/authorize-request", () => ({ authorizeAdminRequest }));
vi.mock("@/lib/travelpayouts", () => ({
  createTravelpayoutsPartnerLinks,
  isTravelpayoutsConfigured: () => true,
  TravelpayoutsError: class TravelpayoutsError extends Error {
    status = 500;
  },
}));

import { POST } from "@/app/api/travelpayouts/links/route";

function request(body: unknown): Request {
  return new Request("https://goargentina.ru/api/travelpayouts/links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/travelpayouts/links", () => {
  beforeEach(() => {
    process.env.TRAVELPAYOUTS_LINKS_ROUTE_ENABLED = "true";
    vi.clearAllMocks();
    authorizeAdminRequest.mockResolvedValue({ ok: true, user: { id: "admin" } });
    createTravelpayoutsPartnerLinks.mockResolvedValue([]);
  });

  afterEach(() => {
    delete process.env.TRAVELPAYOUTS_LINKS_ROUTE_ENABLED;
  });

  it("does not expose the partner API to anonymous callers", async () => {
    authorizeAdminRequest.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const response = await POST(request({ links: [{ url: "https://youtravel.me/tours/1" }] }));

    expect(response.status).toBe(401);
    expect(createTravelpayoutsPartnerLinks).not.toHaveBeenCalled();
  });

  it("rejects non-partner destinations before calling Travelpayouts", async () => {
    const response = await POST(request({ links: [{ url: "https://evil.example/collect" }] }));

    expect(response.status).toBe(400);
    expect(createTravelpayoutsPartnerLinks).not.toHaveBeenCalled();
  });

  it("accepts official partner destinations for an authorized admin", async () => {
    createTravelpayoutsPartnerLinks.mockResolvedValue([
      { url: "https://youtravel.me/tours/1", code: "success", partnerUrl: "https://tp.media/x" },
    ]);

    const response = await POST(request({ links: [{ url: "https://youtravel.me/tours/1" }] }));

    expect(response.status).toBe(200);
    expect(createTravelpayoutsPartnerLinks).toHaveBeenCalledOnce();
  });
});
