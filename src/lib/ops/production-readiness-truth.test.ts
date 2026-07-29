import { describe, expect, it } from "vitest";
import {
  buildDirectPostgresTargetReadinessCheck,
  buildRecoveryReadinessCheck,
  classifyProductionReadiness,
} from "@/lib/ops/production-readiness-server";
import type { ReadinessCheckItem } from "@/lib/ops/production-readiness-types";

function check(status: ReadinessCheckItem["status"]): ReadinessCheckItem {
  return { id: status, label: status, status, message: status, category: "build" };
}

const recoveryOk: ReadinessCheckItem = {
  id: "recovery:backup-restore",
  label: "recovery",
  status: "ok",
  message: "ok",
  category: "database",
};

describe("production readiness truth", () => {
  it("never calls a production candidate ready with warnings or skipped checks", () => {
    expect(classifyProductionReadiness({ checks: [check("ok"), check("warn")], isProdLike: true }))
      .toBe("needs_verification");
    expect(classifyProductionReadiness({ checks: [check("ok"), check("skip")], isProdLike: true }))
      .toBe("needs_verification");
  });

  it("distinguishes local success from publication readiness", () => {
    expect(classifyProductionReadiness({ checks: [check("ok")], isProdLike: false }))
      .toBe("local_passed");
  });

  it("requires every production check to be green", () => {
    expect(classifyProductionReadiness({ checks: [check("ok"), recoveryOk], isProdLike: true }))
      .toBe("ready_to_publish");
    expect(classifyProductionReadiness({ checks: [check("fail")], isProdLike: true }))
      .toBe("blocked");
  });

  it("never publishes without explicit backup and restore evidence", () => {
    expect(classifyProductionReadiness({ checks: [check("ok")], isProdLike: true }))
      .toBe("needs_verification");
  });

  it("requires fresh backup timestamps and a passed restore report", () => {
    const now = Date.parse("2026-07-17T12:00:00.000Z");
    const valid = buildRecoveryReadinessCheck({
      backupProductionReady: true,
      backupVerifiedAt: "2026-07-17T10:00:00.000Z",
      restoreVerifiedAt: "2026-07-10T10:00:00.000Z",
      restoreEvidence: {
        kind: "supabase-restore-verification",
        checkedAt: "2026-07-10T10:00:00.000Z",
        status: "passed",
        encryptedArtifactVerified: true,
        comparison: { status: "passed" },
      },
      isProdLike: true,
      now,
    });
    expect(valid.status).toBe("ok");

    expect(buildRecoveryReadinessCheck({
      backupProductionReady: true,
      backupVerifiedAt: "2026-07-17T10:00:00.000Z",
      restoreVerifiedAt: "2026-07-10T10:00:00.000Z",
      restoreEvidence: null,
      isProdLike: true,
      now,
    }).status).toBe("fail");
  });

  it("fails production readiness for unattested or mismatched direct Postgres", () => {
    expect(
      buildDirectPostgresTargetReadinessCheck({
        isProdLike: true,
        connectionAvailable: false,
        diagnostics: {
          source: "POSTGRES_URL",
          mode: "other",
          port: null,
          projectRef: null,
          targetStatus: "unverified",
        },
      }),
    ).toMatchObject({ id: "database:direct-target", status: "fail" });

    expect(
      buildDirectPostgresTargetReadinessCheck({
        isProdLike: true,
        connectionAvailable: false,
        diagnostics: {
          source: "POSTGRES_URL",
          mode: "supabase_session_pooler",
          port: 5432,
          projectRef: "zyxwvutsrqponmlkjihg",
          targetStatus: "mismatch",
        },
      }),
    ).toMatchObject({ status: "fail" });
  });

  it("accepts only an available verified direct Postgres target", () => {
    expect(
      buildDirectPostgresTargetReadinessCheck({
        isProdLike: true,
        connectionAvailable: true,
        diagnostics: {
          source: "DATABASE_URL",
          mode: "supabase_direct",
          port: 5432,
          projectRef: "abcdefghijklmnopqrst",
          targetStatus: "verified",
        },
      }),
    ).toMatchObject({ status: "ok" });
  });
});
