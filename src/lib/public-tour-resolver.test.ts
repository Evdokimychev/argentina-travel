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

  it("keeps confirmed empty distinct from operational unavailability for optional embeds", async () => {
    const { filterToursWithResolvedPublicDetailOrThrow } = await import(
      "@/lib/public-tour-resolver"
    );
    const tours = [
      {
        id: "1",
        slug: "argentina-unavailable",
        title: "Patagonia",
        country: "Argentina",
        destination: "El Calafate",
        region: "Patagonia",
        partnerSource: "tripster",
      },
    ] as never;

    vi.mocked(fetchCutoverTourDetailResultBySlug).mockResolvedValue({ status: "ok", data: null });
    vi.mocked(fetchPartnerTourDetailResultServer).mockResolvedValue({ status: "ok", data: null });
    vi.mocked(fetchYouTravelTourDetailResultServer).mockResolvedValue({ status: "ok", data: null });
    await expect(filterToursWithResolvedPublicDetailOrThrow(tours)).resolves.toEqual([]);

    vi.mocked(fetchCutoverTourDetailResultBySlug).mockResolvedValue({
      status: "unavailable",
      retryable: true,
      errorClass: "db_unavailable",
      message: "database down",
    });
    await expect(filterToursWithResolvedPublicDetailOrThrow(tours)).rejects.toThrow(
      "public_tour_details_unavailable",
    );
  });

  it("bounds cold catalog detail resolution to three concurrent operations", async () => {
    const { filterToursWithResolvedPublicDetail } = await import(
      "@/lib/public-tour-resolver"
    );
    let active = 0;
    let peak = 0;

    vi.mocked(fetchCutoverTourDetailResultBySlug).mockImplementation(async (slug: string) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return {
        status: "ok",
        data: {
          slug,
          title: slug,
          reviews: [],
          reviewCount: 0,
          rating: 0,
        } as never,
      };
    });

    const tours = Array.from({ length: 12 }, (_, index) => ({
      id: String(index),
      slug: `argentina-tour-${index}`,
      title: `Tour ${index}`,
      country: "Argentina",
      destination: "Patagonia",
      region: "Patagonia",
      partnerSource: "tripster",
    })) as never;

    const filtered = await filterToursWithResolvedPublicDetail(tours);

    expect(filtered).toHaveLength(12);
    expect(peak).toBe(3);
  });

  it("deduplicates the same in-flight catalog detail across concurrent renders", async () => {
    const { filterToursWithResolvedPublicDetail } = await import(
      "@/lib/public-tour-resolver"
    );
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    vi.mocked(fetchCutoverTourDetailResultBySlug).mockImplementation(async (slug: string) => {
      await gate;
      return {
        status: "ok",
        data: {
          slug,
          title: slug,
          reviews: [],
          reviewCount: 0,
          rating: 0,
        } as never,
      };
    });

    const tours = [{
      id: "shared",
      slug: "argentina-shared-tour",
      title: "Shared tour",
      country: "Argentina",
      destination: "Patagonia",
      region: "Patagonia",
      partnerSource: "tripster",
    }] as never;
    const callCountBefore = vi.mocked(fetchCutoverTourDetailResultBySlug).mock.calls.length;

    const first = filterToursWithResolvedPublicDetail(tours);
    const second = filterToursWithResolvedPublicDetail(tours);

    await vi.waitFor(() => {
      expect(fetchCutoverTourDetailResultBySlug).toHaveBeenCalledTimes(callCountBefore + 1);
    });
    release();

    await expect(Promise.all([first, second])).resolves.toEqual([tours, tours]);
  });

  it("clears unavailable in-flight results so a later render retries the source", async () => {
    const { filterToursWithResolvedPublicDetail } = await import(
      "@/lib/public-tour-resolver"
    );
    vi.mocked(fetchCutoverTourDetailResultBySlug)
      .mockResolvedValueOnce({
        status: "unavailable",
        retryable: true,
        errorClass: "db_unavailable",
        message: "temporary source error",
      })
      .mockResolvedValueOnce({
        status: "ok",
        data: {
          slug: "argentina-retry-tour",
          title: "Recovered tour",
          reviews: [],
          reviewCount: 0,
          rating: 0,
        } as never,
      });
    const tours = [{
      id: "retry",
      slug: "argentina-retry-tour",
      title: "Retry tour",
      country: "Argentina",
      destination: "Patagonia",
      region: "Patagonia",
      partnerSource: "tripster",
    }] as never;
    const callCountBefore = vi.mocked(fetchCutoverTourDetailResultBySlug).mock.calls.length;

    await expect(filterToursWithResolvedPublicDetail(tours)).resolves.toEqual([]);
    await expect(filterToursWithResolvedPublicDetail(tours)).resolves.toEqual(tours);
    expect(fetchCutoverTourDetailResultBySlug).toHaveBeenCalledTimes(callCountBefore + 2);
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
