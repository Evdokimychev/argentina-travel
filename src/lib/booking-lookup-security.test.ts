import { beforeAll, describe, expect, it } from "vitest";

describe("booking lookup security", () => {
  beforeAll(() => {
    process.env.BOOKING_LOOKUP_SECRET = "test-secret-with-enough-entropy";
  });

  it("normalizes valid email without accepting malformed input", async () => {
    const { normalizeLookupEmail } = await import("./booking-lookup-security");
    expect(normalizeLookupEmail(" User@Example.COM ")).toBe("user@example.com");
    expect(normalizeLookupEmail("not-an-email")).toBeNull();
  });

  it("creates six digit codes and purpose-bound hashes", async () => {
    const { generateLookupCode, hashLookupValue, verifyLookupHash } = await import("./booking-lookup-security");
    expect(generateLookupCode()).toMatch(/^\d{6}$/);
    const codeHash = hashLookupValue("code:challenge", "123456");
    expect(verifyLookupHash(codeHash, hashLookupValue("code:challenge", "123456"))).toBe(true);
    expect(verifyLookupHash(codeHash, hashLookupValue("session", "123456"))).toBe(false);
  });
});
