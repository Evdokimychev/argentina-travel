import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

describe("project readiness score", () => {
  it("project:readiness script produces valid JSON report", () => {
    const root = process.cwd();
    const result = spawnSync("node", ["scripts/project-readiness-score.mjs"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(result.status).toBe(0);

    const reportPath = path.join(root, "var/ops/project-readiness-last.json");
    expect(fs.existsSync(reportPath)).toBe(true);
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as {
      overall: number | null;
      grade: string;
      dimensions: Record<string, { score: number | null }>;
    };
    expect(report.grade).toMatch(/^[A-D][+]?$|^—$/);
    expect(report.dimensions).toHaveProperty("code");
    if (report.overall != null) {
      expect(report.overall).toBeGreaterThanOrEqual(0);
      expect(report.overall).toBeLessThanOrEqual(10);
    }
  });
});
