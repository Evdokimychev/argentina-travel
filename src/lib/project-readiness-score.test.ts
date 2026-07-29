import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("project readiness score", () => {
  it("project:readiness script produces valid JSON report", () => {
    const root = process.cwd();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "project-readiness-"));
    const reportPath = path.join(tempDir, "project-readiness.json");

    try {
      const result = spawnSync("node", ["scripts/project-readiness-score.mjs"], {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          PROJECT_READINESS_SKIP_LIVE: "1",
          PROJECT_READINESS_REPORT_FILE: reportPath,
        },
      });
      expect(result.status).toBe(0);

      expect(fs.existsSync(reportPath)).toBe(true);
      const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as {
        schemaVersion: number;
        generatedAt: string;
        baseUrl: string;
        gitSha: string | null;
        overall: number | null;
        grade: string;
        dimensions: Record<string, { score: number | null }>;
        blockers: string[];
        evidence: { reports: Record<string, { valid: boolean; reasons: string[] }> };
      };
      expect(report.schemaVersion).toBe(2);
      expect(Date.parse(report.generatedAt)).not.toBeNaN();
      expect(report.baseUrl).toBe("https://www.goargentina.ru");
      expect(report.gitSha).toBeNull();
      expect(report.grade).toMatch(/^[A-D][+]?$|^—$/);
      expect(report.dimensions).toHaveProperty("code");
      expect(report.evidence.reports.publish.valid).toBe(false);
      expect(report.blockers).toContain("production health is not reachable");
      if (report.overall != null) {
        expect(report.overall).toBeGreaterThanOrEqual(0);
        expect(report.overall).toBeLessThanOrEqual(10);
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
