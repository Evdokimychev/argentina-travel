import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getAllEntries, getAllEntryIds, getHubs } from "./content";

const STATIC_KB_PATH_RE = /(["'`])(\/baza-znaniy\/[a-z0-9/-]+)\1/g;
const KB_ROUTE_PREFIXES = new Set(["poisk", "razdel"]);

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolute);
    if (/\.test\.(?:ts|tsx)$/.test(entry.name)) return [];
    if (absolute.endsWith(path.join("lib", "seo", "publication-registry.ts"))) return [];
    return /\.(?:ts|tsx)$/.test(entry.name) ? [absolute] : [];
  });
}

describe("public KB link contract", () => {
  it("keeps every static KB entry link inside the public catalog", () => {
    const publicIds = new Set(getAllEntryIds());
    const broken: string[] = [];

    for (const file of sourceFiles(path.join(process.cwd(), "src"))) {
      const source = fs.readFileSync(file, "utf8");
      for (const match of source.matchAll(STATIC_KB_PATH_RE)) {
        const href = match[2];
        const [firstSegment, ...rest] = href.slice("/baza-znaniy/".length).split("/");
        if (KB_ROUTE_PREFIXES.has(firstSegment) || rest.length > 0) continue;
        if (!publicIds.has(firstSegment)) {
          broken.push(`${path.relative(process.cwd(), file)} -> ${href}`);
        }
      }
    }

    expect(broken).toEqual([]);
  });

  it("shows eight reviewed public entry points on the KB home page", () => {
    const publicIds = new Set(getAllEntryIds());
    const hubs = getHubs();

    expect(hubs).toHaveLength(8);
    expect(hubs.every((hub) => publicIds.has(hub.id))).toBe(true);
  });

  it("does not expose translation or internal editorial markers", () => {
    const unsafe = getAllEntries()
      .filter((entry) =>
        /автоперевод|требует редакторской вычитки|См\.\s*`?(?:recommendations|warnings)`?\s*в метаданных|Архивный лонгрид|в корне проекта/i.test(
          entry.body ?? "",
        ),
      )
      .map((entry) => entry.id);

    expect(unsafe).toEqual([]);
  });
});
