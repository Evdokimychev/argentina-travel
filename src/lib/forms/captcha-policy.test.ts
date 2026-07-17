import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_FORMS } from "@/lib/cms/site-globals/normalize";
import { isCaptchaRequired } from "@/lib/forms/captcha-policy";

describe("isCaptchaRequired", () => {
  it("keeps all forms open when protection is off", () => {
    expect(isCaptchaRequired(DEFAULT_SITE_FORMS, "contact")).toBe(false);
    expect(isCaptchaRequired(DEFAULT_SITE_FORMS, "native_booking")).toBe(false);
  });

  it("protects only selected forms in selected mode", () => {
    const settings = {
      ...DEFAULT_SITE_FORMS,
      captchaMode: "selected" as const,
      captchaContact: false,
      captchaShopOrder: true,
    };
    expect(isCaptchaRequired(settings, "contact")).toBe(false);
    expect(isCaptchaRequired(settings, "shop_order")).toBe(true);
  });

  it("protects every supported public write in global mode", () => {
    const settings = {
      ...DEFAULT_SITE_FORMS,
      captchaMode: "all_guest_writes" as const,
      captchaPartnerBooking: false,
    };
    expect(isCaptchaRequired(settings, "partner_booking")).toBe(true);
    expect(isCaptchaRequired(settings, "waitlist")).toBe(true);
  });
});
