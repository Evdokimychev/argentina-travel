import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

import { csvCell, toCsv } from "../../scripts/content-overhaul-inventory";
import { isPublicKbEntry } from "./knowledge-base/publication-quality";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "docs/content-overhaul");

const REQUIRED_ARTIFACTS = [
  "README.md", "PARALLEL_WORK_HANDOFF.md", "content-inventory.csv", "content-route-matrix.csv",
  "content-gap-map.csv", "content-quality-score.csv", "content-action-plan.csv", "source-registry.csv",
  "claim-registry.csv", "sensitive-claims.csv", "media-audit.csv", "media-rights-register.csv",
  "missing-media.csv", "duplicate-content-report.csv", "thin-content-report.csv",
  "orphan-content-report.csv", "broken-links.csv", "redirect-map.csv", "taxonomy.md",
  "geography-glossary.csv", "terminology-glossary.csv", "editorial-style-guide.md",
  "content-template-spec.md", "widget-registry.csv", "dynamic-facts-register.csv",
  "search-index-report.md", "related-content-report.csv", "content-governance.md",
  "publication-workflow.md", "content-test-matrix.md", "created-content.csv",
  "rewritten-content.csv", "merged-content.csv", "archived-content.csv", "final-content-report.md",
  "issue-ledger.csv", "inventory-summary.json",
] as const;

describe("content overhaul inventory generator", () => {
  it("escapes CSV values without losing evidence", () => {
    expect(csvCell('Источник "официальный", проверен')).toBe(
      '"Источник ""официальный"", проверен"',
    );
  });

  it("emits the declared header order", () => {
    expect(toCsv(["id", "status"], [{ id: "one", status: "blocked" }])).toBe(
      '"id","status"\n"one","blocked"\n',
    );
  });

  it("keeps the full required evidence package present and non-empty", () => {
    for (const file of REQUIRED_ARTIFACTS) {
      const target = path.join(OUTPUT, file);
      expect(fs.existsSync(target), file).toBe(true);
      expect(fs.statSync(target).size, file).toBeGreaterThan(0);
    }
  });

  it("matches the current KB publication gate counts", () => {
    const index = JSON.parse(
      fs.readFileSync(path.join(ROOT, "content/knowledge-base/_index/content.json"), "utf8"),
    ) as { entities: Parameters<typeof isPublicKbEntry>[0][] };
    const summary = JSON.parse(
      fs.readFileSync(path.join(OUTPUT, "inventory-summary.json"), "utf8"),
    ) as { kbRaw: number; kbPublic: number; kbQuarantined: number };

    const publicCount = index.entities.filter(isPublicKbEntry).length;
    expect(summary.kbRaw).toBe(index.entities.length);
    expect(summary.kbPublic).toBe(publicCount);
    expect(summary.kbQuarantined).toBe(index.entities.length - publicCount);
  });

  it("does not award unmeasured public routes a perfect score or KEEP action", () => {
    const inventory = fs.readFileSync(path.join(OUTPUT, "content-inventory.csv"), "utf8");
    const routeRows = inventory.split("\n").filter((line) => line.startsWith('"route:'));
    expect(routeRows.length).toBeGreaterThan(0);
    expect(routeRows.every((line) => line.includes('"not_measured","HUMAN_REVIEW"'))).toBe(true);
    expect(routeRows.some((line) => line.includes('"100","KEEP"'))).toBe(false);
    expect(
      routeRows.some((line) => /^"route:[^"]+","public_route","[^"]+","ru","not_recorded"/.test(line)),
    ).toBe(false);
  });

  it("keeps widget implementation paths resolvable", () => {
    const registry = fs.readFileSync(path.join(OUTPUT, "widget-registry.csv"), "utf8");
    const implementationPaths = [...registry.matchAll(/"(src\/(?:components|lib)\/[^"]+\.(?:ts|tsx))"/g)]
      .map((match) => match[1])
      .filter((value): value is string => Boolean(value));
    expect(implementationPaths.length).toBeGreaterThan(0);
    for (const implementation of implementationPaths) {
      expect(fs.existsSync(path.join(ROOT, implementation)), implementation).toBe(true);
    }
  });
});
