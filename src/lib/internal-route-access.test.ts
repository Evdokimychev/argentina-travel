import { describe, expect, it } from "vitest";
import {
  isPathWithin,
  isWorkspacePath,
  shouldBlockInternalRoute,
} from "./internal-route-access";

describe("internal route access", () => {
  it("blocks dev routes in production", () => {
    expect(shouldBlockInternalRoute("/dev/design-system", "production")).toBe(true);
    expect(shouldBlockInternalRoute("/dev", "production")).toBe(true);
  });

  it("does not block unrelated routes or local development", () => {
    expect(shouldBlockInternalRoute("/blog", "production")).toBe(false);
    expect(shouldBlockInternalRoute("/dev/design-system", "demo")).toBe(false);
  });

  it("does not treat public organizer profiles as the organizer workspace", () => {
    expect(isPathWithin("/organizer/tours", "/organizer")).toBe(true);
    expect(isWorkspacePath("/organizers/ivan-evdokimychev")).toBe(false);
    expect(isWorkspacePath("/organizer")).toBe(true);
  });
});
