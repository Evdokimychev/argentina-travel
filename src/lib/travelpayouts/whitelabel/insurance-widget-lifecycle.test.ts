import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("insurance whitelabel widget lifecycle", () => {
  it("exposes bounded ready, error, timeout, and retry states", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/insurance/InsuranceWhitelabelWidget.tsx"),
      "utf8",
    );

    expect(source).toContain('"loading" | "ready" | "error" | "timeout"');
    expect(source).toContain("WIDGET_READY_TIMEOUT_MS");
    expect(source).toContain("retryWidget");
    expect(source).toContain("INSURANCE_FALLBACK_URL");
    expect(source).toContain('script.addEventListener("error", markError');
    expect(source).not.toContain('script.addEventListener("error", markReady');
    expect(source).not.toContain("observer.observe(document.body");
    expect(source).not.toContain("setInterval(");
  });
});
