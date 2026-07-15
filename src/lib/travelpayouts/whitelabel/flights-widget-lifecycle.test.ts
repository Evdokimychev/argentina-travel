import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Travelpayouts widget lifecycle", () => {
  it("uses bounded local observers and explicit cleanup", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/flights/FlightsWhitelabelWidgetCore.tsx"),
      "utf8",
    );

    expect(source).not.toContain("observer.observe(document.body");
    expect(source).not.toContain("observer.observe(document.head");
    expect(source).not.toContain("setInterval(syncWidget");
    expect(source).not.toContain('addEventListener("scroll"');
    expect(source).toContain("AbortController");
    expect(source).toContain("ResizeObserver");
    expect(source).toContain("markError");
  });
});
