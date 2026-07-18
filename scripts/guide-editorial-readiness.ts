import fs from "node:fs";
import path from "node:path";
import { GUIDE_HUB } from "@/data/guide-hub-index-content";
import { getGuidePracticalTips } from "@/data/guide-pillar-practical-tips";
import { GUIDE_PILLARS } from "@/data/guide-pillars";
import { GUIDE_TOPICS } from "@/data/guide-topics";
import { getGuideEditorialIssues } from "@/lib/guide-editorial-readiness";

const scopes = [
  { id: "guide-hub", value: GUIDE_HUB },
  ...Object.entries(GUIDE_PILLARS).map(([id, value]) => ({ id: `pillar:${id}`, value })),
  ...Object.keys(GUIDE_TOPICS).flatMap((slug) => {
    const value = getGuidePracticalTips(slug);
    return value ? [{ id: `practical:${slug}`, value }] : [];
  }),
];

const entries = scopes.map((scope) => {
  const issues = getGuideEditorialIssues(scope.value);
  return { id: scope.id, status: issues.length === 0 ? "passed" : "failed", issues };
});
const failed = entries.filter((entry) => entry.status === "failed");
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: "public-guide-copy",
  status: failed.length === 0 ? "passed" : "failed",
  summary: { total: entries.length, passed: entries.length - failed.length, failed: failed.length },
  entries,
};

const output = path.join(process.cwd(), "var/ops/guide-editorial-readiness.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report.summary, null, 2));
console.log(`Guide editorial readiness: ${report.status}. Report: ${path.relative(process.cwd(), output)}`);
if (process.argv.includes("--strict") && report.status !== "passed") process.exitCode = 1;
