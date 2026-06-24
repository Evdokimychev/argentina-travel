import { describe, expect, it } from "vitest";
import { resolveYouTravelGroupSize } from "@/lib/youtravel/partner-tour-group-size";
import { formatTourGroupSizeLabel } from "@/lib/tour-group-size-display";

describe("resolveYouTravelGroupSize", () => {
  it("reads snake_case group size fields", () => {
    expect(
      resolveYouTravelGroupSize({
        group_size_min: 2,
        max_group_size: 14,
      }),
    ).toEqual({ min: 2, max: 14 });
  });
});

describe("formatTourGroupSizeLabel", () => {
  it("shows exact max from tour listing", () => {
    expect(
      formatTourGroupSizeLabel({
        groupSizeMin: 1,
        groupSizeMax: 14,
        groupSizeBucket: "До 20 человек",
      }),
    ).toBe("До 14 человек");
  });

  it("shows range when min is above 1", () => {
    expect(
      formatTourGroupSizeLabel({
        groupSizeMin: 2,
        groupSizeMax: 8,
        groupSizeBucket: "До 8 человек",
      }),
    ).toBe("2–8 человек");
  });
});
