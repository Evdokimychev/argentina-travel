import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("AuthModal submit serialization", () => {
  it("guards overlapping auth submits with an in-flight ref", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/components/auth/AuthModal.tsx"),
      "utf8",
    );
    expect(source).toContain("submitInFlightRef");
    expect(source).toContain("function beginAuthSubmit");
    expect(source).toContain("function endAuthSubmit");
    expect(source).toMatch(/if \(submitInFlightRef\.current \|\| loading\) return false;/);
  });
});
