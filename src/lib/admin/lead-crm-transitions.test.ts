import { describe, expect, it } from "vitest";
import {
  assertContactStatusTransition,
  canTransitionContactStatus,
} from "@/lib/admin/lead-crm-transitions";

describe("CRM lead status transitions", () => {
  it("allows the working path and an explicit reopen", () => {
    expect(canTransitionContactStatus("new", "in_progress")).toBe(true);
    expect(canTransitionContactStatus("in_progress", "waiting")).toBe(true);
    expect(canTransitionContactStatus("waiting", "resolved")).toBe(true);
    expect(canTransitionContactStatus("resolved", "in_progress")).toBe(true);
    expect(canTransitionContactStatus("spam", "new")).toBe(true);
  });

  it("blocks silent reopen from a terminal state", () => {
    expect(canTransitionContactStatus("resolved", "new")).toBe(false);
    expect(canTransitionContactStatus("resolved", "spam")).toBe(false);
    expect(canTransitionContactStatus("spam", "resolved")).toBe(false);
    expect(assertContactStatusTransition("resolved", "new")).toMatchObject({
      ok: false,
      error: expect.stringContaining("недоступен"),
    });
  });
});
