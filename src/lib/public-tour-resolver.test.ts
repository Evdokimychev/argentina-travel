import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tours-server-cutover", () => ({
  fetchCutoverTourDetailResultBySlug: vi.fn(),
}));

vi.mock("@/lib/youtravel/partner-tour-server", () => ({
  fetchYouTravelTourDetailResultServer: vi.fn(),
}));

vi.mock("@/lib/tripster/partner-tour-server", () => ({
  fetchPartnerTourDetailResultServer: vi.fn(),
}));

vi.mock("@/lib/reviews-server", () => ({
  fetchTourPublicReviews: vi.fn(async () => []),
}));

vi.mock("@/lib/youtravel/partner-tour-mapper", () => ({
  isYouTravelTourSlug: (slug: string) => slug.includes("-yt"),
}));

import { fetchCutoverTourDetailResultBySlug } from "@/lib/tours-server-cutover";
import { fetchYouTravelTourDetailResultServer } from "@/lib/youtravel/partner-tour-server";
import { fetchPartnerTourDetailResultServer } from "@/lib/tripster/partner-tour-server";
import { resolvePublicTourBySlug } from "@/lib/public-tour-resolver";

describe("resolvePublicTourBySlug fault injection", () => {
  it("returns unavailable instead of missing when partner sources fail", async () => {
    vi.mocked(fetchCutoverTourDetailResultBySlug).mockResolvedValue({ status: "ok", data: null });
    vi.mocked(fetchYouTravelTourDetailResultServer).mockResolvedValue({
      status: "unavailable",
      retryable: true,
      errorClass: "quota",
      message: "egress",
    });
    vi.mocked(fetchPartnerTourDetailResultServer).mockResolvedValue({
      status: "unavailable",
      retryable: true,
      errorClass: "db_unavailable",
      message: "pg down",
    });

    const resolution = await resolvePublicTourBySlug("argentina-demo-yt55496");
    expect(resolution.status).toBe("unavailable");
    if (resolution.status === "unavailable") {
      expect(resolution.retryable).toBe(true);
    }
  });

  it("returns missing only when sources succeed with null", async () => {
    vi.mocked(fetchCutoverTourDetailResultBySlug).mockResolvedValue({ status: "ok", data: null });
    vi.mocked(fetchYouTravelTourDetailResultServer).mockResolvedValue({
      status: "ok",
      data: null,
    });
    vi.mocked(fetchPartnerTourDetailResultServer).mockResolvedValue({
      status: "ok",
      data: null,
    });

    const resolution = await resolvePublicTourBySlug("no-such-tour-yt99999");
    expect(resolution).toEqual({ status: "missing", reason: "confirmed_absent" });
  });
});

describe("filterToursWithResolvedPublicDetail", () => {
  it("keeps only default-catalog tours that resolve", async () => {
    const { filterToursWithResolvedPublicDetail } = await import(
      "@/lib/public-tour-resolver"
    );
    vi.mocked(fetchCutoverTourDetailResultBySlug).mockImplementation(async (slug: string) => {
      if (slug === "ar-ok") {
        return { status: "ok", data: {
          slug: "ar-ok",
          title: "Argentina tour",
          reviews: [],
          reviewCount: 0,
          rating: 0,
        } as never };
      }
      return { status: "ok", data: null };
    });
    vi.mocked(fetchPartnerTourDetailResultServer).mockResolvedValue({
      status: "ok",
      data: null,
    });
    vi.mocked(fetchYouTravelTourDetailResultServer).mockResolvedValue({
      status: "ok",
      data: null,
    });

    const tours = [
      {
        id: "1",
        slug: "ar-ok",
        title: "Patagonia",
        country: "Argentina",
        destination: "El Calafate",
        region: "Patagonia",
        partnerSource: "tripster",
      },
      {
        id: "2",
        slug: "rio-only",
        title: "Rio carnival",
        country: "Brazil",
        destination: "Rio",
        region: "Rio",
        partnerSource: "tripster",
      },
    ] as never;

    const filtered = await filterToursWithResolvedPublicDetail(tours);
    expect(filtered.map((tour) => tour.slug)).toEqual(["ar-ok"]);
  });
});

describe("platform source fault injection", () => {
  it("propagates platform unavailability instead of returning a false missing", async () => {
    vi.mocked(fetchCutoverTourDetailResultBySlug).mockResolvedValue({
      status: "unavailable",
      retryable: true,
      errorClass: "db_unavailable",
      message: "database down",
    });
    vi.mocked(fetchPartnerTourDetailResultServer).mockResolvedValue({ status: "ok", data: null });
    vi.mocked(fetchYouTravelTourDetailResultServer).mockResolvedValue({ status: "ok", data: null });

    await expect(resolvePublicTourBySlug("platform-only-tour")).resolves.toMatchObject({
      status: "unavailable",
      source: "platform",
      errorClass: "db_unavailable",
    });
  });
});
