import fs from "node:fs";
import path from "node:path";
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import {
  ACCEPTANCE_JOURNEYS,
  journeyIdFromTitle,
} from "../../../src/lib/staging-acceptance/journey-registry";
import { createSafeFingerprint } from "../../../src/lib/staging-acceptance/environment";

type JourneyResult = {
  id: string;
  matrixId: number;
  title: string;
  status: "passed" | "failed" | "skipped" | "not_implemented";
  durationMs: number;
  evidence: string[];
  missingEvidence: string[];
  missingProjects: string[];
};

type ObservedResult = {
  project: string;
  status: TestResult["status"];
  durationMs: number;
  attachments: Array<{ name: string; path: string | null }>;
};

function projectName(test: TestCase): string {
  let suite: Suite | undefined = test.parent;
  while (suite) {
    const project = suite.project();
    if (project?.name) return project.name;
    suite = suite.parent;
  }
  return "unknown";
}

class StagingAcceptanceReporter implements Reporter {
  private readonly observed = new Map<string, ObservedResult[]>();

  onBegin(_config: FullConfig, suite: Suite): void {
    const unknownIds = suite
      .allTests()
      .map((test) => journeyIdFromTitle(test.title))
      .filter((id): id is NonNullable<typeof id> => Boolean(id))
      .filter((id) => !ACCEPTANCE_JOURNEYS.some((journey) => journey.id === id));
    if (unknownIds.length > 0) {
      throw new Error(`[staging-acceptance] tests reference unknown journey ids: ${unknownIds.join(", ")}`);
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const id = journeyIdFromTitle(test.title);
    if (!id) return;
    const results = this.observed.get(id) ?? [];
    results.push({
      project: projectName(test),
      status: result.status,
      durationMs: result.duration,
      attachments: result.attachments.map((attachment) => ({
        name: attachment.name,
        path: attachment.path ?? null,
      })),
    });
    this.observed.set(id, results);
  }

  async onEnd(result: FullResult): Promise<{ status?: FullResult["status"] }> {
    const journeys: JourneyResult[] = ACCEPTANCE_JOURNEYS.map((journey) => {
      const results = this.observed.get(journey.id);
      if (!results) {
        return {
          id: journey.id,
          matrixId: journey.matrixId,
          title: journey.title,
          status: "not_implemented",
          durationMs: 0,
          evidence: [],
          missingEvidence: [...journey.requiredEvidence],
          missingProjects: ["chromium", "webkit"],
        };
      }

      const attachmentNames = new Set(
        results.flatMap((entry) => entry.attachments.map((item) => item.name)),
      );
      const projects = new Set(results.map((entry) => entry.project));
      const missingEvidence = journey.requiredEvidence.filter(
        (boundary) => !attachmentNames.has(boundary),
      );
      const missingProjects = ["chromium", "webkit"].filter((project) => !projects.has(project));
      const hasFailure = results.some((entry) => entry.status !== "passed");
      const hasSkip = results.some((entry) => entry.status === "skipped");
      const status = hasSkip
        ? "skipped"
        : hasFailure || missingEvidence.length > 0 || missingProjects.length > 0
          ? "failed"
          : "passed";
      return {
        id: journey.id,
        matrixId: journey.matrixId,
        title: journey.title,
        status,
        durationMs: results.reduce((total, entry) => total + entry.durationMs, 0),
        evidence: results
          .flatMap((entry) => entry.attachments.map((item) => item.path))
          .filter((item): item is string => Boolean(item)),
        missingEvidence,
        missingProjects,
      };
    });
    const incomplete = journeys.some((journey) => journey.status !== "passed");
    const finalStatus = incomplete ? "failed" : result.status;
    const report = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      runStatus: finalStatus,
      fingerprint: createSafeFingerprint(process.env),
      summary: {
        total: journeys.length,
        passed: journeys.filter((journey) => journey.status === "passed").length,
        failed: journeys.filter((journey) => journey.status === "failed").length,
        skipped: journeys.filter((journey) => journey.status === "skipped").length,
        notImplemented: journeys.filter((journey) => journey.status === "not_implemented").length,
      },
      cleanup: {
        status: "not-run",
        orphanFixtures: null,
        manifestPath: null,
      },
      journeys,
    };

    const reportPath = path.resolve("test-results/staging-acceptance/report.json");
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`[staging-acceptance] report: ${reportPath}`);
    if (incomplete) {
      console.error("[staging-acceptance] acceptance remains blocked until all 25 journeys pass");
    }
    return { status: finalStatus };
  }
}

export default StagingAcceptanceReporter;
