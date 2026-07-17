import { describe, expect, it } from "vitest";
import { buildCutoverChecklist } from "@/components/admin/CutoverChecklistPanel";
import type { ProductionReadinessSnapshot } from "@/lib/ops/production-readiness-types";

function readiness(
  state: ProductionReadinessSnapshot["state"]
): ProductionReadinessSnapshot {
  return {
    ok: state === "ready_to_publish",
    state,
    ranAt: "2026-07-17T00:00:00.000Z",
    source: "inline",
    environment: { nodeEnv: "production", deployEnv: "production" },
    checks: [],
    summary: { ok: 3, warn: 0, fail: 0, skip: state === "needs_verification" ? 1 : 0 },
    scriptReport: null,
  };
}

describe("publication checklist truth", () => {
  it("does not turn an unverified release green when fail and warn counts are zero", () => {
    const item = buildCutoverChecklist(null, readiness("needs_verification"))
      .find((candidate) => candidate.id === "readiness");

    expect(item?.status).toBe("yellow");
  });

  it("shows green only for a release explicitly ready to publish", () => {
    const item = buildCutoverChecklist(null, readiness("ready_to_publish"))
      .find((candidate) => candidate.id === "readiness");

    expect(item?.status).toBe("green");
  });
});
