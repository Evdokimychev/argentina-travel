import { describe, expect, it } from "vitest";
import { parseExcursionListingMeta } from "@/lib/excursion-listing-meta";
import type { TripsterExperience } from "@/lib/tripster/types";

describe("parseExcursionListingMeta formatKind", () => {
  it("uses type=private as individual (Tripster API: exp_format=1 is not group)", () => {
    const meta = parseExcursionListingMeta({
      id: 1,
      type: "private",
      exp_format: 1,
      format: "experience",
      schedule_type: "weekly_range",
      max_persons: 10,
    } satisfies TripsterExperience);
    expect(meta.formatKind).toBe("individual");
  });

  it("uses type=group as group even when exp_format=1", () => {
    const meta = parseExcursionListingMeta({
      id: 2,
      type: "group",
      exp_format: 1,
      schedule_type: "weekly_slots",
      max_persons: 10,
    } satisfies TripsterExperience);
    expect(meta.formatKind).toBe("group");
  });

  it("does not treat exp_format=2 as individual for multi-day tours", () => {
    const meta = parseExcursionListingMeta({
      id: 3,
      type: "tour",
      exp_format: 2,
      format: "activity",
      schedule_type: "fixed_slots",
      max_persons: 12,
    } satisfies TripsterExperience);
    expect(meta.formatKind).toBe("group");
  });

  it("defaults non-tour experiences to individual", () => {
    const meta = parseExcursionListingMeta({
      id: 4,
      type: "experience",
      format: "walk",
      max_persons: 8,
    } satisfies TripsterExperience);
    expect(meta.formatKind).toBe("individual");
  });

  it("detects group excursions via schedule_type", () => {
    const meta = parseExcursionListingMeta({
      id: 5,
      type: "experience",
      schedule_type: "group",
      max_persons: 12,
    } satisfies TripsterExperience);
    expect(meta.formatKind).toBe("group");
  });

  it("does not treat max_persons>1 as group", () => {
    const meta = parseExcursionListingMeta({
      id: 6,
      type: "experience",
      max_persons: 10,
    } satisfies TripsterExperience);
    expect(meta.formatKind).toBe("individual");
  });

  it("keeps multi-day tours as group when unspecified", () => {
    const meta = parseExcursionListingMeta({
      id: 7,
      type: "tour",
      format: "activity",
      max_persons: 12,
    } satisfies TripsterExperience);
    expect(meta.formatKind).toBe("group");
  });

  it("maps real Tripster private excursion payload (id 114465)", () => {
    const meta = parseExcursionListingMeta({
      id: 114465,
      type: "private",
      format: "experience",
      exp_format: 1,
      schedule_type: "weekly_range",
      max_persons: 10,
    } satisfies TripsterExperience);
    expect(meta.formatKind).toBe("individual");
  });
});
