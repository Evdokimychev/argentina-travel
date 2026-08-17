import { describe, expect, it } from "vitest";
import { rejectOversizedJsonBody } from "./request-body-limit";

describe("request body limit guard", () => {
  it("rejects Content-Length above the configured ceiling", () => {
    const response = rejectOversizedJsonBody(
      new Request("https://www.goargentina.ru/api/admin/payments/refund", {
        method: "POST",
        headers: { "content-length": "70000" },
      }),
      65_536,
    );
    expect(response?.status).toBe(413);
  });

  it("allows missing or small Content-Length", () => {
    expect(
      rejectOversizedJsonBody(
        new Request("https://www.goargentina.ru/api/bookings", { method: "POST" }),
        32_768,
      ),
    ).toBeNull();
    expect(
      rejectOversizedJsonBody(
        new Request("https://www.goargentina.ru/api/bookings", {
          method: "POST",
          headers: { "content-length": "1024" },
        }),
        32_768,
      ),
    ).toBeNull();
  });
});
