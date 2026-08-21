import { describe, expect, it } from "vitest";
import { TYPING_PRESENCE_CLEANUP_TTL_SECONDS, TYPING_PRESENCE_TTL_SECONDS } from "@/lib/messaging/constants";

describe("typing presence TTL contract", () => {
  it("keeps active-presence TTL short and cleanup housekeeping longer", () => {
    expect(TYPING_PRESENCE_TTL_SECONDS).toBeLessThanOrEqual(60);
    expect(TYPING_PRESENCE_CLEANUP_TTL_SECONDS).toBeGreaterThan(TYPING_PRESENCE_TTL_SECONDS);
  });
});
