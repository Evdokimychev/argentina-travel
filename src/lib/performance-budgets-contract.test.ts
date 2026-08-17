import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Sprint 3 performance budgets", () => {
  it("audits the four control routes with three cold runs", () => {
    const phase2 = fs.readFileSync(
      path.join(process.cwd(), "scripts/lighthouse-phase2-ci.mjs"),
      "utf8",
    );

    for (const route of ['"/"', '"/tours"', '"/blog"', '"/destinations/patagonia"']) {
      expect(phase2).toContain(route);
    }
    expect(phase2).toContain('LIGHTHOUSE_RUNS_PER_PATH: process.env.LIGHTHOUSE_RUNS_PER_PATH ?? "3"');
  });

  it("enforces LCP, CLS, TBT, transfer and script budgets", () => {
    const runner = fs.readFileSync(
      path.join(process.cwd(), "scripts/lighthouse-blog-cwv.mjs"),
      "utf8",
    );
    const worker = fs.readFileSync(
      path.join(process.cwd(), "scripts/lib/lighthouse-single-run.mjs"),
      "utf8",
    );

    expect(runner).toContain("LIGHTHOUSE_LCP_BUDGET_MS");
    expect(runner).toContain("LIGHTHOUSE_CLS_BUDGET");
    expect(runner).toContain("LIGHTHOUSE_TBT_BUDGET_MS");
    expect(runner).toContain("LIGHTHOUSE_HOME_TRANSFER_BUDGET_BYTES");
    expect(runner).toContain("LIGHTHOUSE_CONTENT_TRANSFER_BUDGET_BYTES");
    expect(runner).toContain("LIGHTHOUSE_SCRIPT_TRANSFER_BUDGET_BYTES");
    expect(runner).toContain('spawnSync("git", ["rev-parse", "HEAD"]');
    expect(runner).toContain("runIsolatedColdAudit");
    expect(runner).toContain("lighthouse-single-run.mjs");
    expect(worker).toContain('launch as launchChrome');
    expect(worker).toContain("disableFullPageScreenshot: true");
  });

  it("keeps the CI budget job blocking and uploads evidence", () => {
    const workflow = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/ci.yml"),
      "utf8",
    );
    const budgetStep = workflow.slice(workflow.indexOf("Blocking public performance budgets"));

    expect(budgetStep).toContain("node scripts/lighthouse-phase2-ci.mjs");
    expect(budgetStep.split("- name: Upload performance evidence")[0]).not.toContain(
      "continue-on-error",
    );
    expect(budgetStep.split("- name: Upload performance evidence")[0]).not.toContain(
      "LIGHTHOUSE_PERF_BUDGET",
    );
    expect(budgetStep.split("- name: Upload performance evidence")[0]).not.toContain(
      "LIGHTHOUSE_LCP_BUDGET_MS",
    );
    expect(budgetStep).toContain("lighthouse-phase2-sample-last.json");
  });
});
