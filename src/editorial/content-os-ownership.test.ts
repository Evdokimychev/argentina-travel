import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

describe("Content OS ownership contract", () => {
  it("keeps the ownership contract published in docs", () => {
    const contract = path.join(root, "docs/editorial/CONTENT_OWNERSHIP_CONTRACT.md");
    expect(fs.existsSync(contract)).toBe(true);
    const text = fs.readFileSync(contract, "utf8");
    expect(text).toContain("Layer A");
    expect(text).toContain("Layer B");
    expect(text).toContain("Layer C");
    expect(text).toContain("BlogBodyBlock");
    expect(text).toContain("resolveBlogPost");
  });

  it("exposes content:quality orchestration scripts", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    expect(pkg.scripts["content:quality"]).toContain("content-quality.mjs");
    expect(pkg.scripts["kb:manifest-stats"]).toContain("kb-manifest-stats.mjs");
    expect(pkg.scripts["content:source-matrix"]).toContain("content-source-matrix.mjs");
  });

  it("keeps Rich→Body adapter as the dual-block bridge", () => {
    const adapter = fs.readFileSync(
      path.join(root, "src/editorial/adapters/blog-body.ts"),
      "utf8",
    );
    expect(adapter).toContain("adaptRichBlockToBody");
    expect(adapter).toContain("adaptRichBlocksToBody");
  });
});
