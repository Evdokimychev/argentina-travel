import { describe, expect, it, vi } from "vitest";
import {
  fetchPublishedListingsResult,
  fetchTourDetailBySlugResult,
} from "@/lib/tour-content-server";

function supabaseListResponse(response: { data: unknown; error: null | { message: string } }) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(async () => response),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.in.mockReturnValue(builder);
  return { from: vi.fn(() => builder) } as never;
}

function supabaseDetailResponse(response: { data: unknown; error: null | { message: string } }) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    maybeSingle: vi.fn(async () => response),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.in.mockReturnValue(builder);
  return { from: vi.fn(() => builder) } as never;
}

describe("tour content read results", () => {
  it("distinguishes a confirmed empty list from a Supabase failure", async () => {
    await expect(
      fetchPublishedListingsResult(supabaseListResponse({ data: [], error: null })),
    ).resolves.toEqual({ status: "ok", data: [] });

    await expect(
      fetchPublishedListingsResult(
        supabaseListResponse({ data: null, error: { message: "database unavailable" } }),
      ),
    ).resolves.toMatchObject({ status: "unavailable" });
  });

  it("returns confirmed missing only for a successful detail query", async () => {
    await expect(
      fetchTourDetailBySlugResult(
        supabaseDetailResponse({ data: null, error: null }),
        "missing",
      ),
    ).resolves.toEqual({ status: "ok", data: null });

    await expect(
      fetchTourDetailBySlugResult(
        supabaseDetailResponse({ data: null, error: { message: "database unavailable" } }),
        "missing",
      ),
    ).resolves.toMatchObject({ status: "unavailable" });
  });
});
