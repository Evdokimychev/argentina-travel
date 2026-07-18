import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  newsletterResult: { data: [] as unknown[], error: null as { message: string } | null },
  contactsResult: { data: [] as unknown[], error: null as { message: string } | null },
}));

vi.mock("@/lib/admin/authorize-request", () => ({
  authorizeAdminRequest: vi.fn().mockResolvedValue({ ok: true, actorId: "admin-1" }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) => {
      const query = {
        select: () => query,
        order: () => query,
        range: () =>
          Promise.resolve(
            table === "newsletter_subscribers" ? mocks.newsletterResult : mocks.contactsResult
          ),
      };
      return query;
    },
  }),
}));

import { GET } from "@/app/api/admin/leads/export/route";

describe("GET /api/admin/leads/export", () => {
  beforeEach(() => {
    mocks.newsletterResult = { data: [], error: null };
    mocks.contactsResult = { data: [], error: null };
  });

  it("returns an error instead of a misleading partial export", async () => {
    mocks.contactsResult = { data: [], error: { message: "database unavailable" } };
    const response = await GET(new Request("https://example.test/api/admin/leads/export"));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Не удалось подготовить выгрузку обращений. Попробуйте ещё раз.",
    });
  });

  it("neutralizes formulas in exported lead fields", async () => {
    mocks.contactsResult = {
      error: null,
      data: [
        {
          kind: "general",
          email: "reader@example.com",
          name: "=HYPERLINK(\"https://evil.example\")",
          phone: "+54 11 1234 5678",
          message: "+SUM(A1:A2)",
          created_at: "2026-07-16T00:00:00.000Z",
        },
      ],
    };
    const response = await GET(new Request("https://example.test/api/admin/leads/export"));
    expect(response.status).toBe(200);
    const csv = await response.text();
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'+SUM(A1:A2)");
  });
});
