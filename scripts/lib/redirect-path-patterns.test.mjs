import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const require = createRequire(import.meta.url);
const { pathToRegexp } = require("next/dist/compiled/path-to-regexp");
const root = process.cwd();

function extractRedirectSources(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  return [...source.matchAll(/source:\s*"([^"]+)"/g)].map((match) => match[1]);
}

function assertValidPathPattern(pattern) {
  assert.doesNotThrow(() => pathToRegexp(pattern), `invalid redirect source: ${pattern}`);
}

describe("next redirect path patterns", () => {
  it("rejects glued repeating-param syntax that broke production next build", () => {
    assert.throws(
      () => pathToRegexp("/st_tour/patagonia-:path*"),
      /Can not repeat "path" without a prefix and suffix/,
    );
    assert.throws(
      () => pathToRegexp("/st_tour/buenos-aires-:path*"),
      /Can not repeat "path" without a prefix and suffix/,
    );
  });

  it("keeps catch-all and slash-delimited repeaters valid", () => {
    assertValidPathPattern("/st_tour/:path*");
    assertValidPathPattern("/st_tour/patagonia/:path*");
    assertValidPathPattern("/st_tour/patagonia-:slug");
  });

  it("validates every legacy tour redirect source in source control", () => {
    const filePath = path.join(root, "src/lib/seo/legacy-tour-redirects.ts");
    const sources = extractRedirectSources(filePath);
    assert.ok(sources.length > 0);
    assert.equal(new Set(sources).size, sources.length);
    assert.equal(sources.some((source) => /-:path\*/.test(source)), false);
    for (const source of sources) {
      assertValidPathPattern(source);
    }
  });

  it("validates next.config catch-all legacy sources", () => {
    const config = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
    const sources = [...config.matchAll(/source:\s*"([^"]+)"/g)].map((match) => match[1]);
    assert.ok(sources.includes("/st_tour/:path*"));
    for (const source of sources) {
      assertValidPathPattern(source);
    }
  });
});
