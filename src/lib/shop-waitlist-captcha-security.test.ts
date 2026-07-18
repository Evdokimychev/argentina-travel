import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("waitlist and shop guest form protection", () => {
  it("verifies waitlist protection before auth, availability and writes", () => {
    const route = source("src/app/api/tours/[slug]/waitlist/route.ts");
    const handler = route.slice(route.indexOf("export async function POST"));

    expect(handler).toContain('formId: "waitlist"');
    expect(handler).toContain("captchaToken: body.captchaToken");
    expect(handler).toContain("honeypot: body.honeypot");
    expect(handler.indexOf("verifyGuestFormProtection")).toBeLessThan(
      handler.indexOf("createSupabaseServerClient"),
    );
    expect(handler.indexOf("verifyGuestFormProtection")).toBeLessThan(
      handler.indexOf("fetchTourAvailabilityBySlug"),
    );
    expect(handler).toContain('code: "FORM_PROTECTION_UNAVAILABLE"');
    expect(handler).toContain("return NextResponse.json({ ok: true });");
  });

  it("verifies shop protection before validation, product lookup and writes", () => {
    const route = source("src/app/api/shop/orders/route.ts");
    const handler = route.slice(route.indexOf("async function postShopOrder"));

    expect(handler).toContain('formId: "shop_order"');
    expect(handler).toContain("captchaToken: body.captchaToken");
    expect(handler).toContain("honeypot: body.honeypot");
    expect(handler.indexOf("verifyGuestFormProtection")).toBeLessThan(
      handler.indexOf("getShopProductBySlug"),
    );
    expect(handler.indexOf("verifyGuestFormProtection")).toBeLessThan(
      handler.indexOf("createSupabaseServerClient"),
    );
    expect(handler).toContain("return NextResponse.json({ ok: true });");
    expect(handler).not.toContain("console.");
  });

  it("sends a Turnstile token and honeypot from both public forms", () => {
    const waitlist = source("src/components/tour-detail/TourWaitlistModal.tsx");
    const shop = source("src/components/shop/ShopCheckoutModal.tsx");

    for (const component of [waitlist, shop]) {
      expect(component).toContain('name="company"');
      expect(component).toContain("captchaToken");
      expect(component).toContain("honeypot");
      expect(component).toContain("TurnstileField");
    }
    expect(waitlist).toContain('formId="waitlist"');
    expect(waitlist).toContain('body.code !== "FORM_PROTECTION_UNAVAILABLE"');
    expect(shop).toContain('formId="shop_order"');
  });
});
