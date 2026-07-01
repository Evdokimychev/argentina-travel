import { describe, expect, it } from "vitest";
import { SITE_EMAIL, SITE_SUPPORT_EMAIL } from "@/data/site-support-email";

describe("site-support-email", () => {
  it("exports canonical support email", () => {
    expect(SITE_SUPPORT_EMAIL).toBe("hello@goargentina.ru");
  });

  it("SITE_EMAIL uses canonical address for display and mailto", () => {
    expect(SITE_EMAIL.display).toBe(SITE_SUPPORT_EMAIL);
    expect(SITE_EMAIL.href).toBe(`mailto:${SITE_SUPPORT_EMAIL}`);
  });
});
