import { afterEach, describe, expect, it, vi } from "vitest";
import {
  classifyPartnerError,
  logPartnerSourceUnavailable,
  partnerOk,
  partnerSourceUnavailableError,
  partnerUnavailable,
  partnerUnavailableFromError,
} from "@/lib/partner-source-result";

afterEach(() => {
  vi.restoreAllMocks();
});

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

  it("logs only the bounded source, class and retryability contract", () => {
    const providerText =
      "Tripster said token=secret-marker and traveler@example.com in an upstream body";
    const error = partnerUnavailable("provider_5xx", providerText);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logPartnerSourceUnavailable("tripster_detail", error);

    expect(consoleError).toHaveBeenCalledWith("[partner_source_unavailable]", {
      source: "tripster_detail",
      errorClass: "provider_5xx",
      retryable: true,
    });
    const serializedLog = JSON.stringify(consoleError.mock.calls);
    expect(serializedLog).not.toContain(providerText);
    expect(serializedLog).not.toContain("secret-marker");
    expect(serializedLog).not.toContain("traveler@example.com");
  });

  it("creates a public-runtime-safe compatibility error", () => {
    const providerText = "external response with password=hunter2";
    const result = partnerUnavailable("quota", providerText);

    const error = partnerSourceUnavailableError("tripster_listings", result);

    expect(error.name).toBe("PartnerSourceUnavailableError");
    expect(error.message).toBe("tripster_listings_unavailable:quota");
    expect(error.message).not.toContain(providerText);
    expect(error.message).not.toContain("hunter2");
  });
});
