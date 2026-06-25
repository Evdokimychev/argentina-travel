import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import fs from "node:fs";
import path from "node:path";
import {
  assignViolationIds,
  buildBacklogMarkdown,
  parseUxAuditTestTitle,
  readUxViolationsFromFile,
  resetUxAuditViolationsFile,
  severityForCheck,
  viewportNameFromProject,
  type UxAuditReport,
  type UxViolation,
  UX_AUDIT_BACKLOG_PATH,
  UX_AUDIT_JSON_PATH,
} from "../helpers/ux-audit";

function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}

function resolveProjectName(test: TestCase): string {
  let suite: Suite | undefined = test.parent;
  while (suite) {
    const project = suite.project();
    if (project?.name) return project.name;
    suite = suite.parent;
  }
  return "";
}

class SprintBacklogReporter implements Reporter {
  private violations: UxViolation[] = [];

  private stats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  onBegin(_config: FullConfig, suite: Suite): void {
    resetUxAuditViolationsFile();
    this.stats.total = suite.allTests().length;
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === "passed") {
      this.stats.passed += 1;
      return;
    }
    if (result.status === "skipped") {
      this.stats.skipped += 1;
      return;
    }

    this.stats.failed += 1;

    const parsed = parseUxAuditTestTitle(test.title);
    if (!parsed?.route || !parsed.check) return;

    const viewport = viewportNameFromProject(resolveProjectName(test));
    const message = stripAnsi(
      result.errors.map((error) => error.message?.split("\n")[0] ?? "Assertion failed").join("; ") ||
        "Assertion failed",
    );

    this.violations.push({
      route: parsed.route,
      viewport,
      check: parsed.check,
      severity: severityForCheck(parsed.check),
      message,
      testTitle: test.title,
    });
  }

  onEnd(result: FullResult): void {
    const fileViolations = readUxViolationsFromFile();
    const merged = assignViolationIds(
      [...this.violations, ...fileViolations].filter(
        (violation, index, all) =>
          all.findIndex(
            (candidate) =>
              candidate.route === violation.route &&
              candidate.viewport === violation.viewport &&
              candidate.check === violation.check &&
              candidate.message === violation.message,
          ) === index,
      ),
    );

    const report: UxAuditReport = {
      runAt: new Date().toISOString(),
      summary: {
        total: this.stats.total,
        passed: this.stats.passed,
        failed: this.stats.failed,
        skipped: this.stats.skipped,
        violations: merged.length,
      },
      violations: merged,
    };

    fs.mkdirSync(path.dirname(UX_AUDIT_JSON_PATH), { recursive: true });
    fs.writeFileSync(UX_AUDIT_JSON_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(UX_AUDIT_BACKLOG_PATH, `${buildBacklogMarkdown(report)}\n`, "utf8");

    if (merged.length > 0) {
      console.log(
        `\n[ux-audit] ${merged.length} violation(s) → ${UX_AUDIT_JSON_PATH} and ${UX_AUDIT_BACKLOG_PATH}`,
      );
    }

    if (result.status !== "passed" && merged.length === 0) {
      console.log("[ux-audit] Tests failed but no structured violations were captured.");
    }
  }
}

export default SprintBacklogReporter;
