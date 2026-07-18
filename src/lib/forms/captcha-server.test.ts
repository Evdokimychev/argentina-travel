import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SITE_FORMS } from "@/lib/cms/site-globals/normalize";

const { fetchSiteForms } = vi.hoisted(() => ({ fetchSiteForms: vi.fn() }));

vi.mock("@/lib/site-settings-server", () => ({ fetchSiteForms }));
vi.mock("@/lib/rate-limit", () => ({ getClientIp: () => "203.0.113.10" }));

import { verifyGuestFormProtection } from "@/lib/forms/captcha-server";

describe("verifyGuestFormProtection", () => {
  beforeEach(() => {
    fetchSiteForms.mockResolvedValue(DEFAULT_SITE_FORMS);
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("rejects the honeypot before reading settings or making a network request", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    await expect(
      verifyGuestFormProtection({
        request: new Request("https://www.goargentina.ru/api/contact"),
        formId: "contact",
        honeypot: "robot company",
      }),
    ).resolves.toEqual({ ok: false, kind: "bot" });
    expect(fetchSiteForms).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not require a challenge while protection is disabled", async () => {
    await expect(
      verifyGuestFormProtection({
        request: new Request("https://www.goargentina.ru/api/contact"),
        formId: "contact",
      }),
    ).resolves.toEqual({ ok: true });
  });

  it("fails closed when an enabled policy has no protected keys", async () => {
    fetchSiteForms.mockResolvedValue({
      ...DEFAULT_SITE_FORMS,
      captchaMode: "selected",
      captchaContact: true,
    });
    await expect(
      verifyGuestFormProtection({
        request: new Request("https://www.goargentina.ru/api/contact"),
        formId: "contact",
        captchaToken: "token",
      }),
    ).resolves.toEqual({ ok: false, kind: "configuration" });
  });

  it("accepts a matching Turnstile action and hostname", async () => {
    fetchSiteForms.mockResolvedValue({
      ...DEFAULT_SITE_FORMS,
      captchaMode: "selected",
      captchaContact: true,
    });
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret-key");
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, action: "contact", hostname: "www.goargentina.ru" }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchSpy);

    await expect(
      verifyGuestFormProtection({
        request: new Request("https://www.goargentina.ru/api/contact"),
        formId: "contact",
        captchaToken: "opaque-token",
      }),
    ).resolves.toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("siteverify");
  });
});
