import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("public mobile action copy", () => {
  it.each([
    ["src/components/marketplace/CatalogDepartureCalendarButton.tsx", "Календарь"],
    ["src/components/marketplace/CatalogFiltersSheet.tsx", "Показать"],
    ["src/components/excursions/ExcursionCatalogFiltersSheet.tsx", "Показать"],
    ["src/components/contacts/ContactOfficeMap.tsx", "Показать карту"],
    ["src/components/podbor/PodborView.tsx", "Продолжить"],
  ])("keeps %s concise on phones", (path, label) => {
    const content = source(path);
    expect(content).toContain('className="sm:hidden"');
    expect(content).toContain(`>${label}<`);
  });
});
