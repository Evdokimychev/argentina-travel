import { describe, expect, it } from "vitest";
import { parseExcursionListingMeta } from "@/lib/excursion-listing-meta";
import type { TripsterExperience } from "@/lib/tripster/types";

describe("parseExcursionListingMeta formatKind", () => {
  it("uses exp_format=2 as individual", () => {
    const meta = parseExcursionListingMeta({ exp_format: 2, type: "experience" } satisfies TripsterExperience);
    expect(meta.formatKind).toBe("individual");
  });

  it("uses exp_format=1 as group", () => {
    const meta = parseExcursionListingMeta({ exp_format: 1, type: "experience" } satisfies TripsterExperience);
    expect(meta.formatKind).toBe("group");
  });

  it("defaults non-tour experiences to individual", () => {
    const meta = parseExcursionListingMeta({
      type: "experience",
      format: "walk",
      max_persons: 8,
    } satisfies TripsterExperience);
    expect(meta.formatKind).toBe("individual");
  });

  it("detects group excursions via schedule_type", () => {
    const meta = parseExcursionListingMeta({
      type: "experience",
      schedule_type: "group",
      max_persons: 12,
    } satisfies TripsterExperience);
    expect(meta.formatKind).toBe("group");
  });

  it("does not treat max_persons>1 as group", () => {
    const meta = parseExcursionListingMeta({
      type: "experience",
      max_persons: 10,
    } satisfies TripsterExperience);
    expect(meta.formatKind).toBe("individual");
  });

  it("keeps multi-day tours as group when unspecified", () => {
    const meta = parseExcursionListingMeta({
      type: "tour",
      format: "activity",
      max_persons: 12,
    } satisfies TripsterExperience);
    expect(meta.formatKind).toBe("group");
  });
});
