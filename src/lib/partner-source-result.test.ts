import { describe, expect, it } from "vitest";
import {
  classifyPartnerError,
  partnerOk,
  partnerUnavailable,
  partnerUnavailableFromError,
} from "@/lib/partner-source-result";

describe("partner-source-result", () => {
  it("keeps successful payloads distinct from unavailable", () => {
    expect(partnerOk([1, 2])).toEqual({ status: "ok", data: [1, 2] });
    expect(partnerUnavailable("network", "boom")).toMatchObject({
      status: "unavailable",
      retryable: true,
      errorClass: "network",
    });
  });

  it("classifies common operational failures", () => {
    expect(classifyPartnerError(new Error("Service restricted due to exceed_egress_quota"))).toBe(
      "quota",
    );
    expect(classifyPartnerError(new Error("request timed out"))).toBe("timeout");
    const unavailable = partnerUnavailableFromError(new Error("ECONNRESET"));
    expect(unavailable.status).toBe("unavailable");
    if (unavailable.status === "unavailable") {
      expect(unavailable.errorClass).toBe("network");
    }
  });
});
