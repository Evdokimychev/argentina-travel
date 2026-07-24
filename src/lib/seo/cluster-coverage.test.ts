import { describe, expect, it } from "vitest";
import {
  evaluateSeoClusterCoverage,
  summarizeSeoClusterCoverage,
} from "@/lib/seo/cluster-coverage";

describe("seo cluster coverage", () => {
  it("marks stable commercial landings as covered", () => {
    const rows = evaluateSeoClusterCoverage();
    const iguazu = rows.find((row) => row.id === "iguazu");
    const patagonia = rows.find((row) => row.id === "tours-patagonia");
    expect(iguazu?.commercialLanding).toBe(true);
    expect(iguazu?.status).toBe("ok");
    expect(patagonia?.commercialLanding).toBe(true);
    expect(patagonia?.status).toBe("ok");
  });

  it("summarizes coverage without inventing search volumes", () => {
    const summary = summarizeSeoClusterCoverage(evaluateSeoClusterCoverage());
    expect(summary.total).toBeGreaterThan(0);
    expect(summary.ok + summary.warn + summary.missing).toBe(summary.total);
  });
});
