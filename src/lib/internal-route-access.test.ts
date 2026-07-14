import { describe, expect, it } from "vitest";
import { shouldBlockInternalRoute } from "./internal-route-access";

describe("internal route access", () => {
  it("blocks dev routes in production", () => {
    expect(shouldBlockInternalRoute("/dev/design-system", "production")).toBe(true);
    expect(shouldBlockInternalRoute("/dev", "production")).toBe(true);
  });

  it("does not block unrelated routes or local development", () => {
    expect(shouldBlockInternalRoute("/blog", "production")).toBe(false);
    expect(shouldBlockInternalRoute("/dev/design-system", "demo")).toBe(false);
  });
});
