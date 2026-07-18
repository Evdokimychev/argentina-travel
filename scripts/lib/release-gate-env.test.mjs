import assert from "node:assert/strict";
import test from "node:test";

import {
  SEO_PRODUCTION_BASELINE_REPORT_PATH,
  releaseGateCheckEnv,
} from "./release-gate-env.mjs";

test("isolates the live production SEO baseline from candidate evidence", () => {
  assert.deepEqual(releaseGateCheckEnv("seo-live-baseline", {}), {
    SEO_AUDIT_REPORT_PATH: SEO_PRODUCTION_BASELINE_REPORT_PATH,
  });
});

test("ignores the canonical candidate report variable for the live baseline", () => {
  process.env.SEO_AUDIT_REPORT_PATH = "var/ops/seo-audit-last.json";
  try {
    assert.deepEqual(releaseGateCheckEnv("seo-live-baseline"), {
      SEO_AUDIT_REPORT_PATH: SEO_PRODUCTION_BASELINE_REPORT_PATH,
    });
  } finally {
    delete process.env.SEO_AUDIT_REPORT_PATH;
  }
});

test("does not add SEO report settings to unrelated checks", () => {
  assert.deepEqual(releaseGateCheckEnv("content-lint"), {});
});
