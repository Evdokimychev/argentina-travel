import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("platform-maintenance isolation contract", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/app/api/cron/platform-maintenance/route.ts"),
    "utf8",
  );

  it("gives every subtask an AbortController timeout", () => {
    expect(source).toContain("AbortController");
    expect(source).toContain("DEFAULT_SUBTASK_TIMEOUT_MS");
    expect(source).toContain("timeout_after_");
  });

  it("continues sibling subtasks after a non-critical failure", () => {
    expect(source).toContain("criticalFailures");
    expect(source).toContain("critical: false");
    expect(source).not.toMatch(/checks\.push\(response\.ok\);\s*[\s\S]*checks\.every/);
  });

  it("tolerates non-JSON subtask responses", () => {
    expect(source).toContain("nonJson");
    expect(source).toContain("invalid_json");
  });
});
