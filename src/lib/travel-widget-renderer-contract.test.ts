import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("travel widget renderer public fallback", () => {
  it("keeps unknown editorial keys out of public copy", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/travel/TravelWidgetRenderer.tsx"),
      "utf8",
    );

    expect(source).not.toContain("widget: {key}");
    expect(source).not.toContain("font-mono");
    expect(source).toMatch(/return null;\s*\n}/);
  });
});
