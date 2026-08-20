import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("repository efficiency guards", () => {
  it("ignores research/third-party dumps so they cannot re-enter the tree", () => {
    const gitignore = readFileSync(path.join(process.cwd(), ".gitignore"), "utf8");
    expect(gitignore).toMatch(/research\/third-party\//);
  });

  it("keeps research captures out of Vercel build context", () => {
    const vercelIgnore = readFileSync(path.join(process.cwd(), ".vercelignore"), "utf8");
    expect(vercelIgnore).toMatch(/^research$/m);
  });
});
