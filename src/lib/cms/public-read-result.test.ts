import { describe, expect, it, vi } from "vitest";
import {
  CmsPublicContentUnavailableError,
  classifyCmsPublicReadError,
  createCmsPublicUnavailableReporter,
  withCmsPublicFallback,
} from "@/lib/cms/public-read-result";

describe("CMS public unavailable semantics", () => {
  it("classifies stable PostgREST codes without depending on provider messages", () => {
    expect(classifyCmsPublicReadError({ status: 402, message: "restricted" })).toBe("quota");
    expect(classifyCmsPublicReadError({ code: "PGRST003" })).toBe("timeout");
    expect(classifyCmsPublicReadError({ code: "42501" })).toBe("auth_restricted");
    expect(classifyCmsPublicReadError({ code: "PGRST001" })).toBe("db_unavailable");
    expect(classifyCmsPublicReadError(new DOMException("aborted", "TimeoutError"))).toBe(
      "timeout",
    );
  });

  it("rate-limits generic logs by scope and error class without raw errors", () => {
    let now = 0;
    const log = vi.fn();
    const report = createCmsPublicUnavailableReporter({
      now: () => now,
      cooldownMs: 100,
      log,
    });

    expect(report("blog:catalog", "quota")).toBe(true);
    expect(report("blog:catalog", "quota")).toBe(false);
    expect(report("blog:catalog", "timeout")).toBe(true);
    now = 101;
    expect(report("blog:catalog", "quota")).toBe(true);

    expect(log).toHaveBeenCalledTimes(3);
    expect(JSON.stringify(log.mock.calls)).not.toContain("message");
  });

  it("applies reviewed fallback only to typed CMS outages", async () => {
    await expect(
      withCmsPublicFallback("guide:catalog", ["reviewed"], async () => {
        throw new CmsPublicContentUnavailableError("quota");
      }),
    ).resolves.toEqual(["reviewed"]);

    await expect(
      withCmsPublicFallback("guide:catalog", [], async () => {
        throw new Error("programming defect");
      }),
    ).rejects.toThrow("programming defect");
  });
});
