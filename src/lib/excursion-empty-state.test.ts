import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const LOCALES = ["ru", "en", "es", "pt"];
const DEVELOPMENT_COPY_RE =
  /скоро появится|скоро пополнится|coming soon|próximamente|em breve|npm run|tripster:sync|sputnik8:sync/i;

describe("excursion empty state copy", () => {
  it.each(LOCALES)("uses customer-facing copy for %s", (locale) => {
    const dictionary = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "src/locales", locale, "common.json"), "utf8"),
    ) as Record<string, string>;
    const copy = `${dictionary["excursions.emptySoonTitle"]} ${dictionary["excursions.emptySoonDescription"]}`;

    expect(copy).not.toMatch(DEVELOPMENT_COPY_RE);
    expect(copy.length).toBeGreaterThan(30);
  });
});
