import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("SharePageLinkButton clipboard fallback", () => {
  it("copies the URL when Web Share is missing or fails for non-cancel reasons", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/content/SharePageLinkButton.tsx"),
      "utf8",
    );
    expect(source).toContain("navigator.clipboard.writeText(url)");
    expect(source).toContain('error.name === "AbortError"');
    expect(source).toContain("Ссылка скопирована");
  });
});
