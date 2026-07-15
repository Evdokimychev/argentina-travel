import { describe, expect, it } from "vitest";

import { cmsPublicationGateMessage, parseCmsPublicationGate } from "./publication-gate";

describe("CMS publication gate", () => {
  it("parses a successful database response", () => {
    expect(
      parseCmsPublicationGate({
        ok: true,
        errors: [],
        sourceCount: 2,
        claimCount: 4,
        invalidMediaCount: 0,
      })
    ).toEqual({ ok: true, errors: [], sourceCount: 2, claimCount: 4, invalidMediaCount: 0 });
  });

  it("fails closed for an invalid response", () => {
    expect(parseCmsPublicationGate(null).ok).toBe(false);
  });

  it("returns an editor-friendly explanation", () => {
    const result = parseCmsPublicationGate({
      ok: false,
      errors: ["missing_reviewer", "review_due"],
    });
    expect(cmsPublicationGateMessage(result)).toContain("не назначен проверяющий");
    expect(cmsPublicationGateMessage(result)).toContain("срок проверки истёк");
  });
});
