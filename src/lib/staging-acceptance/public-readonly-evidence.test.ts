import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildReadOnlyCleanupManifest,
  isForbiddenPartnerOrderWrite,
  produceReadOnlyCleanupManifest,
} from "../../../tests/staging-acceptance/helpers/public-readonly-evidence";

describe("public read-only staging evidence", () => {
  it("builds a truthful zero-fixture manifest in the run namespace", () => {
    const manifest = buildReadOnlyCleanupManifest({
      runId: "acceptance-20260717-001",
      journeyId: "J01",
      projectName: "chromium",
      now: new Date("2026-07-17T12:00:00.000Z"),
    });

    expect(manifest).toEqual({
      schemaVersion: 1,
      runId: "acceptance-20260717-001",
      namespace: "acceptance-20260717-001:public-readonly:J01-J03",
      scope: "public-read-only",
      status: "passed",
      orphanFixtures: 0,
      fixtureCount: 0,
      evidenceLevel: "no-fixtures-created",
      completedJourneys: ["J01"],
      completedProjects: ["chromium"],
      generatedAt: "2026-07-17T12:00:00.000Z",
    });
  });

  it("atomically merges completed journeys and browser projects", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "readonly-cleanup-"));
    try {
      produceReadOnlyCleanupManifest({
        root,
        runId: "run-001",
        journeyId: "J02",
        projectName: "webkit",
      });
      const second = produceReadOnlyCleanupManifest({
        root,
        runId: "run-001",
        journeyId: "J01",
        projectName: "chromium",
      });

      expect(second.completedJourneys).toEqual(["J01", "J02"]);
      expect(second.completedProjects).toEqual(["chromium", "webkit"]);
      expect(second.orphanFixtures).toBe(0);
      const stored = JSON.parse(fs.readFileSync(
        path.join(root, "test-results/staging-acceptance/cleanup-manifest.json"),
        "utf8",
      ));
      expect(stored).toEqual(second);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("does not merge a manifest from another run", () => {
    const prior = buildReadOnlyCleanupManifest({
      runId: "old-run",
      journeyId: "J03",
      projectName: "webkit",
    });
    const next = buildReadOnlyCleanupManifest({
      runId: "new-run",
      journeyId: "J01",
      projectName: "chromium",
      prior,
    });

    expect(next.runId).toBe("new-run");
    expect(next.completedJourneys).toEqual(["J01"]);
    expect(next.completedProjects).toEqual(["chromium"]);
  });

  it("detects internal and external partner order writes but allows handoff reads", () => {
    expect(isForbiddenPartnerOrderWrite(
      "POST",
      "https://staging.example/api/tripster/booking-request",
    )).toBe(true);
    expect(isForbiddenPartnerOrderWrite(
      "POST",
      "https://experience.tripster.ru/api/partners/example/external_orders/",
    )).toBe(true);
    expect(isForbiddenPartnerOrderWrite(
      "GET",
      "https://staging.example/api/affiliate/go/example-tour",
    )).toBe(false);
  });
});
