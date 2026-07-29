import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("partner catalog request deadlines", () => {
  it("bounds authenticated Tripster reads and token acquisition", () => {
    for (const relativePath of [
      "src/lib/tripster/auth.ts",
      "src/lib/tripster/client.ts",
    ]) {
      expect(source(relativePath)).toContain("AbortSignal.timeout(");
    }
  });

  it("bounds YouTravel API, public JSON/HTML, and curl fallback reads", () => {
    expect(source("src/lib/youtravel/client.ts")).toContain("AbortSignal.timeout(");
    const publicDescription = source("src/lib/youtravel/public-description.ts");
    expect(publicDescription).toContain("AbortSignal.timeout(PUBLIC_PAGE_READ_TIMEOUT_MS)");
    expect(publicDescription).toContain('"--max-time",\n        "8"');
  });
});
