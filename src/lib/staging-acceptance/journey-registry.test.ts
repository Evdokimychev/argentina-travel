import { describe, expect, it } from "vitest";
import {
  ACCEPTANCE_EVIDENCE_BOUNDARIES,
  ACCEPTANCE_JOURNEYS,
  journeyIdFromTitle,
} from "./journey-registry";

describe("Sprint 0A acceptance journey registry", () => {
  it("contains exactly the 25 roadmap journeys in order", () => {
    expect(ACCEPTANCE_JOURNEYS).toHaveLength(25);
    expect(ACCEPTANCE_JOURNEYS.map((journey) => journey.matrixId)).toEqual(
      Array.from({ length: 25 }, (_, index) => index + 1),
    );
    expect(new Set(ACCEPTANCE_JOURNEYS.map((journey) => journey.id)).size).toBe(25);
  });

  it("requires evidence at every UI to cleanup boundary", () => {
    for (const journey of ACCEPTANCE_JOURNEYS) {
      expect(journey.requiredEvidence).toEqual(ACCEPTANCE_EVIDENCE_BOUNDARIES);
      expect(journey.roles.length).toBeGreaterThan(0);
    }
  });

  it("extracts a registry id only from tagged Playwright titles", () => {
    expect(journeyIdFromTitle("[J17] Native booking")).toBe("J17");
    expect(journeyIdFromTitle("Read-only environment health")).toBeNull();
  });
});
