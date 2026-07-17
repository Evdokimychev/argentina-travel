import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const NAV_ENTRIES = [
  resolve(ROOT, "src/components/Header.tsx"),
  resolve(ROOT, "src/data/site-nav.ts"),
];
const FORBIDDEN_MODULES = [
  resolve(ROOT, "src/data/blog.ts"),
  resolve(ROOT, "src/lib/media-resolver.ts"),
  resolve(ROOT, "src/data/media-library/manifest.json"),
];

const LOCAL_IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;

function resolveLocalImport(fromFile: string, specifier: string): string | null {
  if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return null;

  const unresolved = specifier.startsWith("@/")
    ? resolve(ROOT, "src", specifier.slice(2))
    : resolve(dirname(fromFile), specifier);
  const candidates = extname(unresolved)
    ? [unresolved]
    : [
        `${unresolved}.ts`,
        `${unresolved}.tsx`,
        `${unresolved}.json`,
        join(unresolved, "index.ts"),
        join(unresolved, "index.tsx"),
      ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function collectLocalDependencies(entries: string[]): Set<string> {
  const visited = new Set<string>();
  const pending = [...entries];

  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || visited.has(file)) continue;
    visited.add(file);

    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(LOCAL_IMPORT_RE)) {
      if (/^(?:import|export)\s+type\b/.test(match[0])) continue;
      const dependency = resolveLocalImport(file, match[1] ?? "");
      if (dependency && !visited.has(dependency)) pending.push(dependency);
    }
  }

  return visited;
}

describe("root navigation performance boundary", () => {
  it("does not pull the editorial catalog or media manifest into the client navigation", () => {
    const dependencies = collectLocalDependencies(NAV_ENTRIES);
    const heavyDependencies = FORBIDDEN_MODULES.filter((file) => dependencies.has(file));

    expect(heavyDependencies.map((file) => file.replace(`${ROOT}/`, ""))).toEqual([]);
  });
});
